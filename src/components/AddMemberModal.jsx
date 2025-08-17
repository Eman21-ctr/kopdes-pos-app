import React, { useState } from 'react';

const AddMemberModal = ({ onClose, onAddMember }) => {
    const [memberId, setMemberId] = useState('');
    const [fullName, setFullName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!memberId.trim() || !fullName.trim()) {
            alert('No Anggota dan Nama Lengkap tidak boleh kosong.');
            return;
        }
        onAddMember({
            id: memberId.trim(),
            name: fullName.trim(),
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Tambah Anggota Baru</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="memberId" className="block text-sm font-medium text-slate-700">No. Anggota</label>
                        <input 
                            type="text" 
                            id="memberId"
                            value={memberId} 
                            onChange={(e) => setMemberId(e.target.value)} 
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                        <input 
                            type="text" 
                            id="fullName"
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)} 
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                            required 
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                            Batal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                            Simpan Anggota
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;