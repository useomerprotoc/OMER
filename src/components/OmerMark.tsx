/**
 * The OMER mark: the ring render, keyed off its orange field so it drops onto
 * the warm black without a halo. Raster on purpose, because the shading is what
 * makes it read as a solid body rather than a drawn circle.
 */
export function OmerMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/omer-mark.png"
      width={size}
      height={size}
      alt="OMER"
      draggable={false}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
