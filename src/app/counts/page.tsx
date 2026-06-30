'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Search, Scale, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clientRequest } from '@/lib/clientApi';
import { Ingredient, StockCountAdjustment } from '@/types';

export default function CountsPage() {
  const router = useRouter();
  const { isAuthenticated, activeAccount, isLoading: authLoading } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [adjustments, setAdjustments] = useState<StockCountAdjustment[]>([]);
  const [countedValues, setCountedValues] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ingredientData, adjustmentData] = await Promise.all([
        clientRequest<Ingredient[]>('/api/ingredients', undefined, 'Malzemeler alinamadi'),
        clientRequest<StockCountAdjustment[]>('/api/stock-counts', undefined, 'Sayım kayitlari alinamadi'),
      ]);

      setIngredients(ingredientData);
      setAdjustments(adjustmentData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Veriler alinamadi';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadData();
    }
  }, [isAuthenticated, activeAccount?.id]);

  const filteredIngredients = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return ingredients;
    }

    return ingredients.filter((ingredient) =>
      [ingredient.name, ingredient.category, ingredient.sku, ingredient.supplier]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword))
    );
  }, [ingredients, search]);

  const changedItems = useMemo(() => {
    return ingredients
      .map((ingredient) => {
        const rawValue = countedValues[ingredient.id];
        if (rawValue === undefined || rawValue === '') {
          return null;
        }

        const countedStock = Number.parseFloat(rawValue);
        if (Number.isNaN(countedStock) || countedStock === ingredient.currentStock) {
          return null;
        }

        return {
          ingredientId: ingredient.id,
          countedStock,
          note: notes[ingredient.id]?.trim() || undefined,
        };
      })
      .filter(Boolean) as Array<{ ingredientId: number; countedStock: number; note?: string }>;
  }, [countedValues, ingredients, notes]);

  const handleSubmit = async () => {
    if (!changedItems.length) {
      toast.error('Kaydedilecek sayım farki yok');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await clientRequest<{ adjustedCount: number }>(
        '/api/stock-counts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: changedItems }),
        },
        'Sayım kaydi olusturulamadi'
      );

      toast.success(`${result.adjustedCount} malzeme duzeltildi`);
      setCountedValues({});
      setNotes({});
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sayım kaydi olusturulamadi';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
          <p className="text-slate-500">Sayım hazirlaniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-violet-600">
                <Scale size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Stok Sayımı</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-800">Fiziksel sayım duzeltmesi</h1>
              <p className="mt-1 text-slate-500">
                Sayilan stogu gir. Sistem mevcut stokla farki hesaplayip duzeltme hareketi olusturur.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Malzeme, kategori, SKU..."
                  className="rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-violet-500 focus:bg-white"
                />
              </div>
              <button
                onClick={() => void loadData()}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RefreshCcw size={16} />
                Yenile
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-100 transition-all hover:bg-violet-700 disabled:bg-violet-300"
              >
                {isSubmitting ? 'Kaydediliyor...' : `Farklari Kaydet (${changedItems.length})`}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left">Malzeme</th>
                  <th className="px-6 py-4 text-left">Kategori / SKU</th>
                  <th className="px-6 py-4 text-left">Sistem Stogu</th>
                  <th className="px-6 py-4 text-left">Sayilan Stok</th>
                  <th className="px-6 py-4 text-left">Fark</th>
                  <th className="px-6 py-4 text-left">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredIngredients.map((ingredient) => {
                  const countedValue = countedValues[ingredient.id] ?? '';
                  const countedNumber = countedValue === '' ? ingredient.currentStock : Number.parseFloat(countedValue);
                  const difference = Number.isNaN(countedNumber) ? 0 : countedNumber - ingredient.currentStock;

                  return (
                    <tr key={ingredient.id} className="align-top transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{ingredient.name}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{ingredient.unit}</p>
                        {ingredient.supplier && <p className="mt-2 text-xs text-slate-500">{ingredient.supplier}</p>}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <p>{ingredient.category || '-'}</p>
                        <p className="mt-1 text-xs text-slate-400">{ingredient.sku || '-'}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{ingredient.currentStock}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={countedValue}
                          onChange={(event) =>
                            setCountedValues((current) => ({
                              ...current,
                              [ingredient.id]: event.target.value,
                            }))
                          }
                          placeholder={`${ingredient.currentStock}`}
                          className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all focus:border-violet-500 focus:bg-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-mono font-bold ${
                            difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {difference > 0 ? '+' : ''}
                          {Number.isFinite(difference) ? difference : 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={notes[ingredient.id] || ''}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [ingredient.id]: event.target.value,
                            }))
                          }
                          placeholder="Sayım notu"
                          className="w-full min-w-40 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all focus:border-violet-500 focus:bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Scale size={18} className="text-violet-600" />
            <h2 className="text-lg font-bold text-slate-800">Son sayım duzeltmeleri</h2>
          </div>

          <div className="space-y-3">
            {adjustments.length === 0 ? (
              <p className="text-sm text-slate-400">Henuz sayım duzeltmesi yok.</p>
            ) : (
              adjustments.map((adjustment) => (
                <div key={adjustment.id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{adjustment.ingredient?.name || 'Malzeme'}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {`${adjustment.expectedStock} -> ${adjustment.countedStock} ${adjustment.ingredient?.unit || ''}`}
                    </p>
                    {adjustment.note && <p className="mt-1 text-xs text-slate-400">{adjustment.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold ${adjustment.difference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {adjustment.difference > 0 ? '+' : ''}
                      {adjustment.difference}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(adjustment.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
