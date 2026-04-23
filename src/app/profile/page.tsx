'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Settings, User, Mail, Phone, Building, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, account, isLoading, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    accountName: account?.name || '',
    accountPhone: account?.phone || '',
  });

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSave = async () => {
    if (!token) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Profil güncellendi');
        setIsEditing(false);
        // Refresh the page to update the context
        window.location.reload();
      } else {
        toast.error('Profil güncellenemedi');
      }
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !account) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-100">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Profil Ayarları</h1>
            <p className="text-slate-500">Hesap ve kullanıcı bilgilerinizi yönetin</p>
          </div>
        </div>

        {/* Profil Cards */}
        <div className="space-y-6">
          {/* Kullanıcı Bilgileri */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Kullanıcı Bilgileri
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Kullanıcı Adı
                  </label>
                  <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 font-semibold">
                    @{user.username}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Email
                  </label>
                  <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" />
                    {user.email}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                  Üyelik Tarihi
                </label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Hesap Bilgileri */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building size={20} className="text-emerald-600" />
                Hesap Bilgileri
              </h2>
              {!isEditing && (
                <button
                  onClick={() => {
                    setFormData({
                      accountName: account.name,
                      accountPhone: account.phone || '',
                    });
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Düzenle
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              {!isEditing ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                      İşletme/Kişi Adı
                    </label>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 font-semibold">
                      {account.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Hesap Email
                      </label>
                      <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-2">
                        <Mail size={16} className="text-slate-400" />
                        {account.email}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Telefon
                      </label>
                      <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-2">
                        <Phone size={16} className="text-slate-400" />
                        {account.phone || 'Belirtilmemiş'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                      Hesap Oluşturma Tarihi
                    </label>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      {account.createdAt ? new Date(account.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      İşletme/Kişi Adı
                    </label>
                    <input
                      type="text"
                      value={formData.accountName}
                      onChange={(e) =>
                        setFormData({ ...formData, accountName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.accountPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, accountPhone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+90 (555) 123-4567"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-400 text-slate-800 font-semibold rounded-lg transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

