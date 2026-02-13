import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ProfileModal({ onClose }) {
  const { user, login } = useAuth();

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [preview, setPreview] = useState(user.avatar);
  const [file, setFile] = useState(null);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);

    if (file) {
      formData.append("avatar", file);
    }

    const { data } = await api.put("/user/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    login({ ...user, ...data });
    onClose();
  };

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-100 rounded-lg p-5 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

        <div className="flex flex-col items-center mb-4">
          <img
            src={preview || "https://ui-avatars.com/api/?name=" + user.name}
            className="w-20 h-20 rounded-full object-cover mb-2"
          />

          <input type="file" onChange={handleImageChange} />
        </div>
        <input
          className="w-full border p-2 mb-3 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />

        <input
          className="w-full border p-2 mb-3 rounded"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
