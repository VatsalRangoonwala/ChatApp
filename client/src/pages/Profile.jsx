import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import toast from "react-hot-toast";
import { ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export default function ProfileModal() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [preview, setPreview] = useState(user.avatar);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
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
      setSaving(false);
      toast.success("Profile updated");

      login({ ...user, ...data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Profile update failed");
      // console.log(err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };
  
  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-4 pt-8">
        <div className="fade-in w-full max-w-md">
          <button
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chats
          </button>

          <div className="rounded-xl border border-border bg-card p-6">
            {/* Avatar */}
            <div className="mb-6 flex flex-col items-center">
              <div className="relative">
                <PhotoProvider>
                  <PhotoView
                    src={
                      preview || "https://ui-avatars.com/api/?name=" + user.name
                    }
                  >
                    <img
                      src={
                        preview ||
                        "https://ui-avatars.com/api/?name=" + user.name
                      }
                      className="object-cover flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary"
                    />
                  </PhotoView>
                </PhotoProvider>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <label htmlFor="avatar">
                    <Camera className="h-4 w-4" />
                  </label>
                  <input
                    hidden
                    id="avatar"
                    type="file"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={120}
                  className="w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {bio.length}/120
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Status
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-input px-3.5 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-online" />
                  <span className="text-sm text-foreground">Online</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
