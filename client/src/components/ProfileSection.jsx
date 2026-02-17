import { useAuth } from "../context/AuthContext";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

export default function ProfileSection({ onOpen }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        <PhotoProvider>
          <PhotoView
            src={
              user?.avatar || "https://ui-avatars.com/api/?name=" + user?.name
            }
          >
            <img
              src={
                user?.avatar || "https://ui-avatars.com/api/?name=" + user?.name
              }
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
            />
          </PhotoView>
        </PhotoProvider>

        <div>
          <p className="font-semibold text-sm">{user?.name}</p>
          <p className="text-xs text-gray-500">Me</p>
        </div>
      </div>
      <div className="flex gap-2 items-end">
        <button
          onClick={onOpen}
          className="text-gray-500 hover:bg-gray-100 cursor-pointer text-xl rounded-full p-2"
        >
          ⚙
        </button>
        <button
          onClick={logout}
          className="text-red-700 hover:bg-gray-100 cursor-pointer text-xl rounded-full p-2"
        >
          [➔
        </button>
      </div>
    </div>
  );
}
