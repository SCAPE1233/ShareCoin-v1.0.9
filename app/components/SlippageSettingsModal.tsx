"use client";

import React, { useState } from "react";

interface SlippageSettingsModalProps {
  slippage: string;
  deadline: string;
  onSave: (newSlippage: string, newDeadline: string) => void;
  onClose: () => void;
}

const SlippageSettingsModal: React.FC<SlippageSettingsModalProps> = ({
  slippage,
  deadline,
  onSave,
  onClose,
}) => {
  const [localSlippage, setLocalSlippage] = useState<string>(slippage);
  const [localDeadline, setLocalDeadline] = useState<string>(deadline);

  const handleSave = () => {
    onSave(localSlippage, localDeadline);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 w-[40rem]">
        <h2 className="text-white text-4xl mb-6">Slippage Settings</h2>
        <div className="mb-4">
          <label className="block text-white text-2xl mb-2">
            Slippage Tolerance (%)
          </label>
          <input
            type="number"
            value={localSlippage}
            onChange={(e) => setLocalSlippage(e.target.value)}
            className="w-full p-4 rounded bg-gray-800 text-white text-2xl"
          />
        </div>
        <div className="mb-4">
          <label className="block text-white text-2xl mb-2">
            Transaction Deadline (minutes)
          </label>
          <input
            type="number"
            value={localDeadline}
            onChange={(e) => setLocalDeadline(e.target.value)}
            className="w-full p-4 rounded bg-gray-800 text-white text-2xl"
          />
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-500 p-4 rounded text-3xl font-semibold focus:outline-none"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-500 p-4 rounded text-3xl font-semibold focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlippageSettingsModal;
