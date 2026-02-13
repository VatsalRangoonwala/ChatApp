export default function ProfileViewer({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-90 rounded-lg shadow-lg p-5">

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center">
          <img
            src={
              user.avatar ||
              "https://ui-avatars.com/api/?name=" + user.name
            }
            className="w-28 h-28 rounded-full object-cover mb-3"
          />

          <h2 className="text-lg font-semibold">
            {user.name}
          </h2>

          {user.bio && (
            <p className="text-gray-500 text-sm mt-2 text-center">
              {user.bio}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
