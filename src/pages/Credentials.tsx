import React, { useState, useEffect } from "react";
import { getCollection, addItem } from "../lib/db";
import { decryptText, encryptText } from "../lib/crypto";
import { Credential } from "../types";
import { Search, Plus, Key, Copy, Check, Eye, EyeOff, X, QrCode } from "lucide-react";
import CustomFieldsEditor from "../components/CustomFieldsEditor";
import QRCodeModal from "../components/QRCodeModal";

export default function Credentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [decryptedTokens, setDecryptedTokens] = useState<
    Record<string, string>
  >({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCred, setNewCred] = useState({
    name: "",
    token: "",
    category: "عام",
    customFields: [] as { key: string; value: string }[],
  });

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState({ text: "", title: "", category: "" });

  useEffect(() => {
    setCredentials(getCollection<Credential>("credentials"));
  }, []);

  const handleShowQR = async (cred: Credential) => {
    let token = cred.token;
    if (token.startsWith("AES-") || token.length > 30) {
      if (!decryptedTokens[cred.id]) {
        token = await decryptText(cred.token);
        setDecryptedTokens((prev) => ({ ...prev, [cred.id]: token }));
      } else {
        token = decryptedTokens[cred.id];
      }
    }
    setQrModalData({
      text: token,
      title: cred.name,
      category: cred.category || "عام"
    });
    setQrModalOpen(true);
  };

  const handleCopy = async (cred: Credential) => {
    let token = cred.token;
    if (token.startsWith("AES-") || token.length > 30) {
      if (!decryptedTokens[cred.id]) {
        token = await decryptText(cred.token);
        setDecryptedTokens((prev) => ({ ...prev, [cred.id]: token }));
      } else {
        token = decryptedTokens[cred.id];
      }
    }
    navigator.clipboard.writeText(token);
    setCopiedId(cred.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReveal = async (cred: Credential) => {
    if (revealedId === cred.id) {
      setRevealedId(null);
      return;
    }

    if (!decryptedTokens[cred.id]) {
      const token = await decryptText(cred.token);
      setDecryptedTokens((prev) => ({ ...prev, [cred.id]: token }));
    }
    setRevealedId(cred.id);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const encryptedToken = await encryptText(newCred.token);
    const credData = {
      name: newCred.name,
      token: encryptedToken,
      category: newCred.category,
      customFields: newCred.customFields,
      description: "",
      subcategory: "",
      expiryDate: "",
      isFavorite: false,
      isPinned: false,
      status: "active",
      tags: [],
      lastUsed: null,
      usageCount: 0,
      notes: "",
    };
    addItem("credentials", credData);
    setCredentials(getCollection<Credential>("credentials"));
    setShowAddForm(false);
    setNewCred({ name: "", token: "", category: "عام", customFields: [] });
  };

  const filtered = credentials.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة المفاتيح</h2>
          <p className="text-gray-400">جميع المفاتيح وبيانات الدخول</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="بحث عن مفتاح..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)] focus:ring-1 focus:ring-[var(--color-neon-blue)] transition-all"
            />
            <Search
              size={18}
              className="absolute top-2.5 right-3 text-gray-400"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-[var(--color-neon-blue)] text-dark-bg px-4 py-2 rounded-lg font-bold hover:bg-[#00CCCC] transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            إضافة مفتاح
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass card-glow border border-[var(--color-neon-blue)] rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">إضافة مفتاح جديد</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  الاسم
                </label>
                <input
                  required
                  type="text"
                  value={newCred.name}
                  onChange={(e) =>
                    setNewCred({ ...newCred, name: e.target.value })
                  }
                  className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  التصنيف
                </label>
                <input
                  required
                  type="text"
                  value={newCred.category}
                  onChange={(e) =>
                    setNewCred({ ...newCred, category: e.target.value })
                  }
                  className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">
                  المفتاح / التوكين الأساسي
                </label>
                <input
                  required
                  type="password"
                  value={newCred.token}
                  onChange={(e) =>
                    setNewCred({ ...newCred, token: e.target.value })
                  }
                  className="w-full bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 text-white focus:outline-none focus:border-[var(--color-neon-blue)] text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <CustomFieldsEditor
              customFields={newCred.customFields}
              onChange={(fields) =>
                setNewCred({ ...newCred, customFields: fields })
              }
            />

            <div className="flex justify-end pt-2 border-t border-[rgba(255,255,255,0.1)] mt-4">
              <button
                type="submit"
                className="bg-[var(--color-neon-blue)] text-black px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 transition-colors"
              >
                حفظ المفتاح
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="glass border border-[rgba(255,255,255,0.05)] rounded-xl overflow-hidden light:bg-light-card light:border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[rgba(0,0,0,0.2)] border-b border-[rgba(255,255,255,0.05)] light:bg-gray-50 light:border-gray-200">
              <tr>
                <th className="py-3 px-4 text-gray-400 font-medium text-sm w-10"></th>
                <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                  اسم المفتاح
                </th>
                <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                  التصنيف
                </th>
                <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                  التوكين
                </th>
                <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.02)] light:divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    لا توجد مفاتيح مسجلة
                  </td>
                </tr>
              ) : (
                filtered.map((cred) => (
                  <tr
                    key={cred.id}
                    className="hover:bg-[rgba(255,255,255,0.02)] transition-colors light:hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <Key
                        size={18}
                        className="text-[var(--color-neon-blue)]"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{cred.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded border border-[rgba(255,255,255,0.1)] text-gray-300">
                        {cred.category || "عام"}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 font-mono text-sm text-gray-400"
                      dir="ltr"
                      style={{ textAlign: "left" }}
                    >
                      <div className="flex items-center gap-2 justify-end">
                        <span className="truncate w-32">
                          {revealedId === cred.id
                            ? decryptedTokens[cred.id] || "جاري فك التشفير..."
                            : "••••••••••••••••"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleShowQR(cred)}
                          className="p-1.5 text-gray-400 hover:text-white bg-[rgba(255,255,255,0.05)] rounded transition-colors"
                          title="عرض رمز QR"
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          onClick={() => handleReveal(cred)}
                          className="p-1.5 text-gray-400 hover:text-white bg-[rgba(255,255,255,0.05)] rounded transition-colors"
                          title="إظهار/إخفاء"
                        >
                          {revealedId === cred.id ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(cred)}
                          className={`p-1.5 rounded transition-colors ${copiedId === cred.id ? "bg-[rgba(57,255,20,0.2)] text-[var(--color-neon-green)]" : "text-gray-400 hover:text-white bg-[rgba(255,255,255,0.05)]"}`}
                          title="نسخ إلى الحافظة"
                        >
                          {copiedId === cred.id ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        text={qrModalData.text}
        title={qrModalData.title}
        category={qrModalData.category}
      />
    </div>
  );
}
