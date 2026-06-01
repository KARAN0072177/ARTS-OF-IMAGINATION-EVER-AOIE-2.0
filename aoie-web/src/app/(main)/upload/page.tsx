import UploadArtworkForm from "@/components/artwork/UploadArtworkForm";

export default function UploadPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Artist Studio
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Upload Artwork
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Add the artwork, details, and tags people need to discover your work.
        </p>
      </div>

      <UploadArtworkForm />
    </section>
  );
}
