import { useAuth } from "../context/AuthContext";

export default function ProfileSection() {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 pb-0">
      
      <div className="flex items-center gap-3">
        <img
          src={
            user?.avatar ||
            "https://ui-avatars.com/api/?name=" + user?.name
          }
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />

        <div>
          <p className="font-semibold text-sm">{user?.name}</p>
          <p className="text-xs text-gray-500">My Profile</p>
        </div>
      </div>

      <button className="text-gray-500 hover:text-gray-700">
        ⚙
      </button>
    </div>
  );
}
