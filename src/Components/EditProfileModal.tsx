import { FC, useEffect, useState } from "react";
import avatar from "../assets/avatar.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";

interface formData {
  name: string;
  bio: string;
  img: File[];
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: {
    name: string;
    bio: string;
    profilePic?: File;
  }) => void;
  currentProfile: { name: string; bio: string; profilePic?: string };
}

const EditProfileModal: FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProfile,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const { register, handleSubmit, watch } = useForm<formData>({
    defaultValues: {
      name: currentProfile.name,
      bio: currentProfile.bio,
    },
  });
  const [img] = watch(["img"]);
  const inputFileRef: { current: HTMLInputElement | null } = { current: null };

  useEffect(() => {
    if (img) {
      setFile(img[0]);
    }
  }, [img]);

  const onSubmit = (data: formData) => {
    onSave({
      ...data,
      profilePic: file || undefined, // Use file for profilePic if it exists
    });
    onClose();
    console.log("DATA", data);
  };

  const { ref, ...rest } = register("img");

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <form
        style={{
          width: "90%",
          maxWidth: "400px",
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          position: "relative",
        }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <button
          type="button"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "#aaa",
            outline: "none",
          }}
          onClick={onClose}
        >
          &times;
        </button>
        <h2
          style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}
        >
          Edit Profile
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
            marginBottom: "20px",
          }}
        >
          <img
            src={
              file
                ? URL.createObjectURL(file)
                : currentProfile.profilePic || avatar
            }
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              border: "2px solid #ddd",
            }}
            alt="Profile"
          />
          <FontAwesomeIcon
            onClick={() => {
              inputFileRef.current?.click();
            }}
            icon={faImage}
            className="fa-xl"
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              cursor: "pointer",
              background: "#fff",
              borderRadius: "50%",
              padding: "5px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              color: " black",
            }}
          />
        </div>
        <input
          {...rest}
          ref={(e) => {
            ref(e);
            inputFileRef.current = e;
          }}
          type="file"
          accept="image/jpeg, image/png"
          style={{ display: "none" }}
        />
        <label style={{ fontWeight: "bold", color: "#333" }}>Name:</label>
        <input
          {...register("name")}
          type="text"
          style={{
            width: "90%",
            alignItems: "center",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "px",
            border: "1px solid #ddd",
            backgroundColor: "#f9f9f9",
            color: "black",
          }}
          required
        />
        <label style={{ fontWeight: "bold", color: "#333" }}>Bio:</label>
        <textarea
          {...register("bio")}
          style={{
            width: "90%",
            alignItems: "center",
            padding: "10px",
            minHeight: "80px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            backgroundColor: "#f9f9f9",
            resize: "none",
            marginBottom: "15px",
            color: "black",
          }}
          required
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            style={{
              padding: "10px 20px",
              backgroundColor: "#f3f3f3",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#555",
              outline: "none",
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              background: "linear-gradient(to right, #3a7bd5, #3a6073)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileModal;
