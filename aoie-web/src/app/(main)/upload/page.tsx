import UploadArtworkForm from "@/components/artwork/UploadArtworkForm";

export default function UploadPage() {
  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Upload Artwork
        </h1>

        <p className="mt-2 text-slate-600">
          Share your artwork with the AOIE community.
        </p>
      </div>

      <UploadArtworkForm />
    </section>
  );
}