import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

export default function ProfileViewer({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-90 rounded-lg shadow-lg p-5">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500">
            ✕
          </button>
        </div>
        <div className="flex flex-col items-center">
          <PhotoProvider>
            <PhotoView
              src={
                user.avatar || "https://ui-avatars.com/api/?name=" + user.name
              }
            >
              <img
                src={
                  user.avatar || "https://ui-avatars.com/api/?name=" + user.name
                }
                className="w-30 h-30 rounded-full object-cover mb-3 cursor-pointer border-4 border-gray-200"
              />
            </PhotoView>
          </PhotoProvider>

          <h2 className="text-lg font-semibold">{user.name}</h2>

          {user.bio && (
            <p className="text-gray-500 text-sm mt-2 text-center">{user.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}
