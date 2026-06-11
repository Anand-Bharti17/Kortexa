import { useState, useEffect } from "react";
import { User, Upload, Save, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import api from "../services/api";
import { useToast } from "../components/ui/Toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const emptyAddress = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

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
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
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

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get("/addresses");
      setAddresses(data || []);
    } catch (error) {
      console.error("Failed to fetch addresses", error);
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

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      await api.post("/addresses", addressForm);
      showToast("Address saved");
      setAddressForm(emptyAddress);
      setShowAddressForm(false);
      fetchAddresses();
    } catch (error) {
      showToast("Failed to save address", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/addresses/${id}`);
      showToast("Address deleted");
      fetchAddresses();
    } catch (error) {
      showToast("Failed to delete address", "error");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      showToast("Default address updated");
      fetchAddresses();
    } catch (error) {
      showToast("Failed to update default address", "error");
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40">
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

      {profile.role === "CUSTOMER" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Address book</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <Plus size={16} />
              Add address
            </button>
          </div>

          <div className="p-6">
            {showAddressForm && (
              <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <input
                  placeholder="Label (Home, Work...)"
                  value={addressForm.label}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, label: e.target.value })
                  }
                  className="input-field sm:col-span-2"
                />
                <input
                  placeholder="Full name *"
                  value={addressForm.fullName}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, fullName: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  placeholder="Phone"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, phone: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  placeholder="Address line 1 *"
                  value={addressForm.line1}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, line1: e.target.value })
                  }
                  className="input-field sm:col-span-2"
                />
                <input
                  placeholder="Address line 2"
                  value={addressForm.line2}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, line2: e.target.value })
                  }
                  className="input-field sm:col-span-2"
                />
                <input
                  placeholder="City *"
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, city: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, state: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  placeholder="Postal code *"
                  value={addressForm.postalCode}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, postalCode: e.target.value })
                  }
                  className="input-field"
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        isDefault: e.target.checked,
                      })
                    }
                  />
                  Set as default
                </label>
                <button
                  type="button"
                  onClick={handleSaveAddress}
                  disabled={savingAddress}
                  className="btn-primary sm:col-span-2"
                >
                  {savingAddress ? "Saving..." : "Save address"}
                </button>
              </div>
            )}

            {addresses.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">
                No saved addresses yet. Add one for faster checkout.
              </p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {addr.fullName}
                        {addr.label ? ` · ${addr.label}` : ""}
                        {(addr.default || addr.isDefault) && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                      </p>
                      <p className="text-sm text-slate-600">
                        {addr.city}
                        {addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
                      </p>
                      {addr.phone && (
                        <p className="text-sm text-slate-500">{addr.phone}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {!(addr.default || addr.isDefault) && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        aria-label="Delete address"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
