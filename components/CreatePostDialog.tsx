"use client";

import { useState, useCallback, useEffect, useRef, startTransition } from "react";
import Dialog from "@/components/Dialog";
import ConfirmPopover from "@/components/ConfirmPopover";
import { createClient } from "@/utils/supabase/client";
import {
  createPost,
  updatePost,
  getRoomChildren,
  getRooms,
  type PostType,
  type RoomChild,
  type Room,
  type PostWithRelations,
} from "@/app/actions/posts";

const supabase = createClient();

type CreatePostDialogProps = {
  open: boolean;
  onClose: () => void;
  editMode?: boolean;
  post?: PostWithRelations;
  onSaved?: () => void;
};

const POST_TYPES: { value: PostType; label: string; bg: string; text: string }[] = [
  { value: "meal", label: "Comida", bg: "#9A7B1E", text: "#FFFFFF" },
  { value: "nap", label: "Siesta", bg: "#E7DCF6", text: "#7B5FC0" },
  { value: "activity", label: "Actividad", bg: "#2E89A6", text: "#FFFFFF" },
  { value: "achievement", label: "Logro", bg: "#CFEBD8", text: "#3E9B6C" },
  { value: "photo", label: "Foto", bg: "#FBD8CC", text: "#D9684A" },
  { value: "announcement", label: "Anuncio", bg: "#CCD8F4", text: "#4E72C8" },
];

export default function CreatePostDialog({
  open,
  onClose,
  editMode = false,
  post,
  onSaved,
}: CreatePostDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PostType | "">("");
  const [body, setBody] = useState("");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [wholeRoom, setWholeRoom] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<
    { id: string; url: string }[]
  >([]);
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);

  const [children, setChildren] = useState<RoomChild[]>([]);
  const [, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    startTransition(() => {
      setLoading(true);
      setError(null);
    });

    Promise.all([getRoomChildren(), getRooms()]).then(
      ([childrenData, roomsData]) => {
        startTransition(() => {
          setChildren(childrenData);
          setRooms(roomsData);
          setLoading(false);
        });
      }
    );
  }, [open]);

  useEffect(() => {
    if (open && editMode && post) {
      startTransition(() => {
        setTitle(post.title || "");
        setType(post.type);
        setBody(post.body || "");
        setSelectedChildIds(post.children.map((c) => c.child_id));
        setWholeRoom(false);
        setExistingPhotos(
          post.photos.map((p) => ({ id: p.id, url: p.url }))
        );
        setRemovedExistingIds([]);
        setFiles([]);
        setPreviews([]);
      });
    } else if (open && !editMode) {
      startTransition(() => {
        setTitle("");
        setType("");
        setBody("");
        setSelectedChildIds([]);
        setWholeRoom(false);
        setFiles([]);
        setPreviews([]);
        setExistingPhotos([]);
        setRemovedExistingIds([]);
      });
    }
  }, [open, editMode, post]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    startTransition(() => {
      setPreviews(urls);
    });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const handleClose = useCallback(() => {
    setTitle("");
    setType("");
    setBody("");
    setSelectedChildIds([]);
    setWholeRoom(false);
    setFiles([]);
    setPreviews([]);
    setExistingPhotos([]);
    setRemovedExistingIds([]);
    setError(null);
    onClose();
  }, [onClose]);

  const toggleChild = useCallback((childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
    setWholeRoom(false);
  }, []);

  const toggleWholeRoom = useCallback(() => {
    setWholeRoom((prev) => {
      if (!prev) setSelectedChildIds([]);
      return !prev;
    });
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      const total =
        files.length + selected.length + existingPhotos.length - removedExistingIds.length;
      if (total > 5) {
        setError("Máximo 5 fotos permitidas");
        return;
      }
      setFiles((prev) => [...prev, ...selected]);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [files.length, existingPhotos.length, removedExistingIds.length]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeExistingPhoto = useCallback((photoId: string) => {
    setRemovedExistingIds((prev) => [...prev, photoId]);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!type) {
      setError("Seleccioná un tipo de publicación");
      return;
    }

    if (!wholeRoom && selectedChildIds.length === 0) {
      setError("Seleccioná al menos un niño o activá \"Toda la sala\"");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editMode && post) {
        const result = await updatePost({
          postId: post.id,
          title: title || undefined,
          type,
          body: body || undefined,
          childIds: selectedChildIds,
          wholeRoom,
          newFiles: files.length > 0 ? files : undefined,
          existingPhotoIds: existingPhotos.map((p) => p.id),
          removedPhotoIds: removedExistingIds,
        });

        if ("error" in result) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createPost({
          title: title || undefined,
          type,
          body: body || undefined,
          childIds: selectedChildIds,
          wholeRoom,
          files: files.length > 0 ? files : undefined,
        });

        if ("error" in result) {
          setError(result.error);
          return;
        }
      }

      handleClose();
      onSaved?.();
    } catch {
      setError("Error al guardar la publicación");
    } finally {
      setSubmitting(false);
    }
  }, [
    type,
    wholeRoom,
    selectedChildIds,
    title,
    body,
    files,
    editMode,
    post,
    existingPhotos,
    removedExistingIds,
    handleClose,
    onSaved,
  ]);

  const visiblePhotos =
    existingPhotos.length + files.length - removedExistingIds.length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      ariaLabel={editMode ? "Editar publicación" : "Crear publicación"}
      maxWidth="md:max-w-[560px]"
    >
      <div
        className="flex items-center justify-between px-[26px] py-5"
        style={{ borderBottom: "1px solid #ECE0D0" }}
      >
        <span className="font-heading font-semibold text-[18px] text-text-primary">
          {editMode ? "Editar publicación" : "Nueva publicación"}
        </span>
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-[26px] py-6 max-h-[70vh] overflow-y-auto">
        {error && (
          <p
            role="alert"
            className="mb-4 text-[13.5px] font-bold text-[#D9583C] bg-[#FBE6DF] border border-[#F0C3B5] rounded-[12px] px-4 py-3"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#A89A8B] text-[14px]">
            Cargando datos…
          </div>
        ) : (
          <>
            {/* Post type pills */}
            <div className="mb-5">
              <label className="block text-[12px] font-bold tracking-[0.7px] text-[#7A6F64] mb-2">
                TIPO
              </label>
              <div className="flex flex-wrap gap-2">
                {POST_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => setType(pt.value)}
                    className="px-3.5 py-1.5 rounded-full text-[12.5px] font-extrabold tracking-[0.3px] transition-all"
                    style={{
                      backgroundColor: type === pt.value ? pt.bg : "#F0E6D8",
                      color: type === pt.value ? pt.text : "#94887B",
                    }}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Children selection */}
            <div className="mb-5">
              <label className="block text-[12px] font-bold tracking-[0.7px] text-[#7A6F64] mb-2">
                PARA
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleWholeRoom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all"
                  style={{
                    backgroundColor: wholeRoom ? "#F2937A" : "#F0E6D8",
                    color: wholeRoom ? "#FFFFFF" : "#6E6359",
                    borderColor: wholeRoom ? "#F2937A" : "#E0D3C3",
                  }}
                >
                  Toda la sala
                </button>
                {children.map((child) => {
                  const selected = selectedChildIds.includes(child.id);
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleChild(child.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all"
                      style={{
                        backgroundColor: selected ? "#F2937A" : "#F0E6D8",
                        color: selected ? "#FFFFFF" : "#6E6359",
                        borderColor: selected ? "#F2937A" : "#E0D3C3",
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-none"
                        style={{
                          backgroundColor: selected
                            ? "rgba(255,255,255,0.3)"
                            : "#E0D3C3",
                          color: selected ? "#FFFFFF" : "#6E6359",
                        }}
                      >
                        {child.full_name[0]?.toUpperCase()}
                      </span>
                      {child.full_name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title (optional) */}
            <div className="mb-[18px]">
              <label
                htmlFor="post-title"
                className="block text-[12px] font-bold tracking-[0.7px] text-[#7A6F64] mb-2"
              >
                TÍTULO{" "}
                <span className="font-normal text-[#A89A8B]">(opcional)</span>
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Recordatorio para la próxima semana"
                className="w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-text-primary py-[13px] px-4 transition-colors"
              />
            </div>

            {/* Body (optional) */}
            <div className="mb-[18px]">
              <label
                htmlFor="post-body"
                className="block text-[12px] font-bold tracking-[0.7px] text-[#7A6F64] mb-2"
              >
                DESCRIPCIÓN{" "}
                <span className="font-normal text-[#A89A8B]">(opcional)</span>
              </label>
              <textarea
                id="post-body"
                value={body}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) setBody(e.target.value);
                }}
                placeholder="Escribí tu publicación aquí…"
                rows={3}
                className="w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-text-primary py-[13px] px-4 transition-colors min-h-[90px] resize-y"
              />
              <div className="text-right text-[11.5px] mt-1 text-[#A89A8B]">
                {body.length}/1000
              </div>
            </div>

            {/* File input */}
            <div className="mb-5">
              <label className="block text-[12px] font-bold tracking-[0.7px] text-[#7A6F64] mb-2">
                FOTOS{" "}
                <span className="font-normal text-[#A89A8B]">
                  (máx. 5, JPG/PNG, 10MB c/u)
                </span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="post-photos-input"
              />
              <label
                htmlFor="post-photos-input"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] border border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[13.5px] text-[#7A6F64] font-semibold cursor-pointer hover:bg-[#EDE3D5] transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Seleccionar fotos
              </label>

              {/* Photo previews */}
              {visiblePhotos > 0 && (
                <div className="flex flex-wrap gap-2.5 mt-3">
                  {existingPhotos.map((photo) => {
                    const { data } = supabase.storage
                      .from("post-photos")
                      .getPublicUrl(photo.url);
                    return (
                      <div
                        key={photo.id}
                        className="relative w-24 h-24 rounded-[10px] overflow-hidden border border-[#E0D3C3]"
                      >
                        <img
                          src={data.publicUrl}
                          alt="Foto existente"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(photo.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[11px]"
                          aria-label="Eliminar foto"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {previews.map((url, i) => (
                    <div
                      key={url}
                      className="relative w-24 h-24 rounded-[10px] overflow-hidden border border-[#E0D3C3]"
                    >
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[11px]"
                        aria-label="Eliminar foto"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit button with confirmation popover */}
            <ConfirmPopover
              trigger={
                <button
                  type="button"
                  disabled={submitting}
                  className="flex items-center justify-center gap-[9px] w-full py-[14px] rounded-[14px] text-white font-extrabold text-[15.5px]"
                  style={{
                    background: submitting
                      ? "linear-gradient(180deg,#D4B8A8,#C4A898)"
                      : "linear-gradient(180deg,#F4977E,#EE8164)",
                    boxShadow: "0 10px 22px -8px rgba(238,129,100,.7)",
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting
                    ? "Guardando…"
                    : editMode
                      ? "Guardar cambios"
                      : "Publicar"}
                </button>
              }
              message={
                editMode
                  ? "¿Confirmás los cambios a esta publicación?"
                  : "¿Confirmás que querés publicar?"
              }
              confirmLabel={editMode ? "Guardar" : "Publicar"}
              onConfirm={handleSubmit}
              variant="primary"
            />
          </>
        )}
      </div>
    </Dialog>
  );
}
