'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';
import { Building, Calendar, Mail, Phone, Plus, Settings, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    activeAccount,
    accounts,
    isLoading,
    switchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    changePassword,
  } = useAuth();

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const beginCreate = () => {
    setIsCreating(true);
    setIsEditing(null);
    setFormData({ name: '', email: '', phone: '' });
  };

  const beginEdit = (accountId: number) => {
    const current = accounts.find((item) => item.id === accountId);
    if (!current) return;
    setIsCreating(false);
    setIsEditing(accountId);
    setFormData({
      name: current.name,
      email: current.email,
      phone: current.phone || '',
    });
  };

  const resetEditor = () => {
    setIsCreating(false);
    setIsEditing(null);
    setFormData({ name: '', email: '', phone: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isCreating) {
        await createAccount(formData);
        toast.success('Sirket olusturuldu');
      } else if (isEditing) {
        await updateAccount(isEditing, formData);
        toast.success('Sirket guncellendi');
      }
      resetEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Islem basarisiz';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAccount(confirmDelete);
      toast.success('Sirket silindi');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sirket silinemedi';
      toast.error(message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Yeni sifreler eslesmiyor');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Sifre degistirildi. Tekrar giris yapin.');
      router.push('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sifre degistirilemedi';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="text-slate-500">Yukleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !activeAccount) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-100">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Profil Ayarlari</h1>
            <p className="text-slate-500">Hesap ve kullanici bilgilerinizi yonetin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <User size={20} className="text-blue-600" />
                  Kullanici Bilgileri
                </h2>
              </div>

              <div className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">Kullanici Adi</label>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                      @{user.username}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-600">Email</label>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                      <Mail size={16} className="text-slate-400" />
                      {user.email}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-600">Uyelik Tarihi</label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    <Calendar size={16} className="text-slate-400" />
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                <h2 className="text-lg font-bold text-slate-800">Sifre Degistir</h2>
                <p className="mt-1 text-sm text-slate-500">Bu islem tum aktif oturumlari kapatir.</p>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Mevcut Sifre</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Yeni Sifre</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Yeni Sifre Tekrar</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={() => void handlePasswordChange()}
                  disabled={isChangingPassword}
                  className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {isChangingPassword ? 'Sifre Guncelleniyor...' : 'Sifreyi Degistir'}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Building size={20} className="text-emerald-600" />
                Sirketlerim
              </h2>
              <button
                onClick={beginCreate}
                className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
              >
                <Plus size={16} />
                Yeni Sirket
              </button>
            </div>

            <div className="space-y-4 p-6">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{account.name}</p>
                        {activeAccount.id === account.id && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} />
                        {account.email}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <Phone size={14} />
                        {account.phone || 'Belirtilmemis'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {activeAccount.id !== account.id && (
                        <button
                          onClick={() => void switchAccount(account.id)}
                          className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                        >
                          Bu Sirketle Calis
                        </button>
                      )}
                      <button
                        onClick={() => beginEdit(account.id)}
                        className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
                      >
                        Duzenle
                      </button>
                      <button
                        onClick={() => setConfirmDelete(account.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(isCreating || isEditing) && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                  <h3 className="mb-4 text-base font-bold text-slate-800">
                    {isCreating ? 'Yeni Sirket Ekle' : 'Sirketi Duzenle'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Sirket Adi</label>
                      <input
                        value={formData.name}
                        onChange={(e) => setFormData((current) => ({ ...current, name: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Sirket Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((current) => ({ ...current, email: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Telefon</label>
                      <input
                        value={formData.phone}
                        onChange={(e) => setFormData((current) => ({ ...current, phone: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="+90 5xx xxx xx xx"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => void handleSave()}
                        disabled={isSaving}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-400"
                      >
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                      <button
                        onClick={resetEditor}
                        disabled={isSaving}
                        className="flex-1 rounded-lg bg-slate-200 px-4 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-300"
                      >
                        Iptal
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Sirketi Sil"
        message="Bu sirket ve bagli tum stok verileri silinir. Son kalan sirket silinemez."
        confirmLabel="Sil"
        cancelLabel="Iptal"
        isDanger
      />
    </div>
  );
}
