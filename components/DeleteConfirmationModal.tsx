import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-red-600">تأكيد حذف الحساب</h2>
        <p className="text-gray-700 mb-6">
          هل أنت متأكد من رغبتك في حذف حسابك بشكل دائم؟ سيتم حذف جميع منشوراتك وتعليقاتك ولا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed w-36"
          >
            {isLoading ? 'جاري الحذف...' : 'نعم، احذف حسابي'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
