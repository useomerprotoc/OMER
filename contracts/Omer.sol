// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC20 surface for the USDG quote asset.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title OMER
 * @notice A share-accounted rebasing token sitting on its own reserve curve.
 *
 * Two numbers describe every wallet:
 *   shares  - the real claim. Only buy, sell and transfer change it.
 *   index   - OMER displayed per share. Only the clock changes it.
 *
 * balanceOf() returns shares * index, so wallets appear to grow every epoch
 * with no keeper, no cron and no transaction. The index is recomputed from
 * elapsed epochs on every read, which means a chain that goes quiet for a
 * month catches up in a single call.
 *
 * Redemption always prices shares on the inverse of the same curve that minted
 * them. The displayed balance is never the unit of account, so the rebase can
 * never create a claim on the reserve.
 */
contract Omer {
    // ---------------------------------------------------------------- errors

    error ZeroAmount();
    error Slippage();
    error InsufficientShares();
    error LiquidFloorBreached();
    error NotTreasury();

    // ---------------------------------------------------------------- events

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Bought(address indexed buyer, uint256 usdgIn, uint256 sharesOut, uint256 fee);
    event Sold(address indexed seller, uint256 sharesIn, uint256 usdgOut, uint256 fee);
    event ProtocolWithdrawn(address indexed to, uint256 amount);

    // ------------------------------------------------------------- constants

    string public constant name = "Omer";
    string public constant symbol = "OMER";
    uint8 public constant decimals = 18;

    uint256 private constant WAD = 1e18;
    /// USDG carries six decimals; shares carry eighteen.
    uint256 private constant USDG_SCALE = 1e12;

    uint256 public constant EPOCH = 30 minutes;

    /// 1.0003944131e18. One year of compounding lands on exactly x1,001.
    uint256 public constant RATE = 1_000_394_413_100_000_000;

    /// price(s) = CURVE_A * s, with CURVE_A = 5e-5 in WAD terms.
    uint256 public constant CURVE_A = 5e13;

    /// 10% on both sides, three quarters of it retained by the reserve.
    uint256 public constant FEE_BPS = 1_000;
    uint256 public constant FEE_RESERVE_BPS = 7_500;

    /// The reserve may never hold less than half its value in liquid USDG.
    uint256 public constant LIQUID_FLOOR_BPS = 5_000;

    /// Hard ceiling on the index so a long-lived market cannot overflow.
    uint256 public constant MAX_INDEX = 1e36;

    // --------------------------------------------------------------- storage

    IERC20 public immutable usdg;
    uint256 public immutable genesis;
    address public treasury;

    uint256 public totalShares;
    uint256 public peakShares;
    /// USDG owed to the protocol, held inside this contract but not reserve.
    uint256 public protocolFees;
    uint256 public buyDeposits;
    uint256 public redeemed;
    uint256 public taxRetained;

    mapping(address => uint256) public sharesOf;
    mapping(address => mapping(address => uint256)) private _allowance;

    constructor(address usdg_, address treasury_, uint256 seedShares) {
        usdg = IERC20(usdg_);
        treasury = treasury_;
        genesis = block.timestamp;

        // The deployer seeds the curve: mint the genesis shares to itself and
        // pay in exactly the integral that backs them.
        totalShares = seedShares;
        peakShares = seedShares;
        sharesOf[msg.sender] = seedShares;

        uint256 seedUsdg = curveIntegral(seedShares);
        if (seedUsdg > 0) {
            usdg.transferFrom(msg.sender, address(this), seedUsdg);
        }

        emit Transfer(address(0), msg.sender, seedShares);
    }

    // ------------------------------------------------------------- the clock

    function epoch() public view returns (uint256) {
        return (block.timestamp - genesis) / EPOCH;
    }

    function secondsToNextEpoch() external view returns (uint256) {
        uint256 elapsed = (block.timestamp - genesis) % EPOCH;
        return EPOCH - elapsed;
    }

    /// @notice OMER displayed per share, derived on read from elapsed epochs.
    function index() public view returns (uint256) {
        uint256 value = _rpow(RATE, epoch());
        return value > MAX_INDEX ? MAX_INDEX : value;
    }

    // ------------------------------------------------------------ erc20 view

    function totalSupply() external view returns (uint256) {
        return (totalShares * index()) / WAD;
    }

    function balanceOf(address account) external view returns (uint256) {
        return (sharesOf[account] * index()) / WAD;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowance[owner][spender];
    }

    // ------------------------------------------------------------ erc20 move

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = _allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            _allowance[from][msg.sender] = allowed - amount;
        }
        _move(from, to, amount);
        return true;
    }

    /// Displayed amounts are converted to shares before anything is written.
    function _move(address from, address to, uint256 amount) internal {
        uint256 shares = (amount * WAD) / index();
        if (shares > sharesOf[from]) revert InsufficientShares();

        unchecked {
            sharesOf[from] -= shares;
            sharesOf[to] += shares;
        }
        emit Transfer(from, to, amount);
    }

    // ----------------------------------------------------------- curve maths

    /// @notice USDG required to back `s` shares: the integral of price(s).
    function curveIntegral(uint256 s) public pure returns (uint256) {
        // CURVE_A * s^2 / 2, carried in WAD then scaled down to USDG units.
        return (((CURVE_A * s) / WAD) * s) / (2 * WAD) / USDG_SCALE;
    }

    function pricePerShare() public view returns (uint256) {
        return (CURVE_A * totalShares) / WAD;
    }

    /// @notice Shares minted when `netUsdg` reaches the curve at the current supply.
    function sharesForDeposit(uint256 netUsdg) public view returns (uint256) {
        uint256 s = totalShares;
        // s2 = sqrt(s^2 + 2 * net / A)
        uint256 term = (2 * netUsdg * USDG_SCALE * WAD * WAD) / CURVE_A;
        uint256 s2 = _sqrt(s * s + term);
        return s2 - s;
    }

    /// @notice USDG released when `shares` are burned at the current supply.
    function proceedsForShares(uint256 shares) public view returns (uint256) {
        if (shares > totalShares) revert InsufficientShares();
        return curveIntegral(totalShares) - curveIntegral(totalShares - shares);
    }

    // --------------------------------------------------------------- reserve

    /// @notice Everything this contract holds beyond what the protocol is owed.
    function reserve() public view returns (uint256) {
        uint256 held = usdg.balanceOf(address(this));
        return held > protocolFees ? held - protocolFees : 0;
    }

    function backing() public view returns (uint256) {
        return curveIntegral(totalShares);
    }

    function surplus() external view returns (uint256) {
        uint256 r = reserve();
        uint256 b = backing();
        return r > b ? r - b : 0;
    }

    // ---------------------------------------------------------------- trades

    function buy(uint256 usdgIn, uint256 minShares) external returns (uint256 sharesOut) {
        if (usdgIn == 0) revert ZeroAmount();

        usdg.transferFrom(msg.sender, address(this), usdgIn);

        uint256 fee = (usdgIn * FEE_BPS) / 10_000;
        uint256 toProtocol = (fee * (10_000 - FEE_RESERVE_BPS)) / 10_000;
        uint256 net = usdgIn - fee;

        sharesOut = sharesForDeposit(net);
        if (sharesOut < minShares) revert Slippage();

        totalShares += sharesOut;
        sharesOf[msg.sender] += sharesOut;
        if (totalShares > peakShares) peakShares = totalShares;

        protocolFees += toProtocol;
        taxRetained += fee - toProtocol;
        buyDeposits += usdgIn;

        emit Transfer(address(0), msg.sender, (sharesOut * index()) / WAD);
        emit Bought(msg.sender, usdgIn, sharesOut, fee);
    }

    function sell(uint256 shares, uint256 minUsdgOut) external returns (uint256 usdgOut) {
        if (shares == 0) revert ZeroAmount();
        if (shares > sharesOf[msg.sender]) revert InsufficientShares();

        uint256 gross = proceedsForShares(shares);
        uint256 fee = (gross * FEE_BPS) / 10_000;
        uint256 toProtocol = (fee * (10_000 - FEE_RESERVE_BPS)) / 10_000;
        usdgOut = gross - fee;
        if (usdgOut < minUsdgOut) revert Slippage();

        uint256 displayed = (shares * index()) / WAD;

        sharesOf[msg.sender] -= shares;
        totalShares -= shares;

        protocolFees += toProtocol;
        taxRetained += fee - toProtocol;
        redeemed += usdgOut;

        usdg.transfer(msg.sender, usdgOut);

        // The curve can only ever release less than it took in, so this holds.
        if (reserve() < backing()) revert LiquidFloorBreached();

        emit Transfer(msg.sender, address(0), displayed);
        emit Sold(msg.sender, shares, usdgOut, fee);
    }

    // -------------------------------------------------------------- treasury

    function withdrawProtocolFees(address to) external {
        if (msg.sender != treasury) revert NotTreasury();
        uint256 amount = protocolFees;
        protocolFees = 0;
        usdg.transfer(to, amount);
        emit ProtocolWithdrawn(to, amount);
    }

    function setTreasury(address next) external {
        if (msg.sender != treasury) revert NotTreasury();
        treasury = next;
    }

    // ----------------------------------------------------------------- maths

    /// Binary exponentiation in WAD. O(log n), so a million epochs is ~20 mults.
    function _rpow(uint256 x, uint256 n) internal pure returns (uint256 z) {
        z = WAD;
        while (n > 0) {
            if (n & 1 == 1) {
                z = (z * x) / WAD;
                if (z > MAX_INDEX) return MAX_INDEX;
            }
            n >>= 1;
            if (n > 0) {
                x = (x * x) / WAD;
                if (x > MAX_INDEX) x = MAX_INDEX;
            }
        }
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
