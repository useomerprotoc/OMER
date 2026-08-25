import { Link } from "react-router-dom";
import { SectionMarker } from "@/components/ui";

export function NotFound() {
  return (
    <section className="px-6 py-32 lg:px-10">
      <SectionMarker index="404" label="No such reading" className="mb-10 max-w-xl" />
      <h1 className="display max-w-xl text-[44px]">
        That page is not on the book.
      </h1>
      <Link to="/" className="btn mt-10">
        Back to the desk
      </Link>
    </section>
  );
}
