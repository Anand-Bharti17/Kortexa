import { useState, useEffect } from "react";
import { User, Upload, Save, Loader2 } from "lucide-react";
import api from "../services/api";

export default function Profile() {
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
      if (profile.name) {
        formData.append("name", profile.name);
      }
      if (imageFile) {
        formData.append("profileImage", imageFile);
      }

      const { data } = await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile({
        ...profile,
        name: data.name || "",
        profileImageUrl: data.profileImageUrl || "",
      });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-10 text-xl font-semibold">Loading Profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8 border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white relative">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-blue-100 opacity-90">Manage your personal information and profile picture.</p>
      </div>

      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center w-full md:w-1/3 space-y-4">
            <div className="relative group w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
              {imagePreview || profile.profileImageUrl ? (
                <img
                  src={imagePreview || profile.profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <User size={64} className="text-gray-400" />
                </div>
              )}
              
              <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Upload className="text-white mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">Click image to upload new</p>
          </div>

          {/* Profile Data Section */}
          <div className="w-full md:w-2/3 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="text"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700">
                    {profile.role}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <div className={`px-4 py-3 border rounded-xl font-medium ${
                      profile.status === 'ACTIVE' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  }`}>
                    {profile.status}
                  </div>
                </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-75"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
