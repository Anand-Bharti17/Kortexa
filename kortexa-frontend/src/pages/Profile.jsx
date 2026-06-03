import { useState, useEffect } from "react";
import { User, Upload, Save, Loader2 } from "lucide-react";
import api from "../services/api";
import { useToast } from "../components/ui/Toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function Profile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    profileImageUrl: "",
    role: "",
    status: "",
    createdAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/users/me");
      setProfile({
        name: data.name || "",
        email: data.email || "",
        profileImageUrl: data.profileImageUrl || "",
        role: data.role || "",
        status: data.status || "",
        createdAt: data.createdAt || "",
      });
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (profile.name) formData.append("name", profile.name);
      if (imageFile) formData.append("profileImage", imageFile);

      const { data } = await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile({
        ...profile,
        name: data.name || "",
        profileImageUrl: data.profileImageUrl || "",
      });
      showToast("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile", error);
      showToast("Error updating profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40">
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-10 text-center text-white sm:px-10">
        <h1 className="text-2xl font-bold sm:text-3xl">My profile</h1>
        <p className="mt-2 text-indigo-100 text-sm sm:text-base">
          Manage your personal information and avatar
        </p>
      </div>

      <div className="p-6 sm:p-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start">
          <div className="flex flex-col items-center md:w-1/3">
            <label className="group relative h-36 w-36 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-xl ring-4 ring-indigo-100">
              {imagePreview || profile.profileImageUrl ? (
                <img
                  src={imagePreview || profile.profileImageUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100">
                  <User size={56} className="text-slate-400" />
                </div>
              )}
              <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                <Upload className="text-white" size={24} />
                <span className="mt-1 text-xs text-white">Change photo</span>
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            <p className="mt-3 text-center text-xs text-slate-500">
              Tap or hover to upload
            </p>
          </div>

          <div className="flex-1 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Full name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                placeholder="Your name"
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="text"
                value={profile.email}
                disabled
                className="input-field !cursor-not-allowed !bg-slate-50 !text-slate-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <div className="input-field !bg-slate-50 font-medium">
                  {profile.role}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Status
                </label>
                <div
                  className={`input-field font-medium ${
                    profile.status === "ACTIVE"
                      ? "!border-emerald-200 !bg-emerald-50 !text-emerald-700"
                      : "!border-amber-200 !bg-amber-50 !text-amber-800"
                  }`}
                >
                  {profile.status}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full !py-3.5"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
