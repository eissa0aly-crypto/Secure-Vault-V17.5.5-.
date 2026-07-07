import React from 'react';
import { Plus, X } from 'lucide-react';

interface CustomFieldsEditorProps {
  customFields: { key: string; value: string }[];
  onChange: (fields: { key: string; value: string }[]) => void;
}

export default function CustomFieldsEditor({ customFields, onChange }: CustomFieldsEditorProps) {
  const addField = () => {
    onChange([...customFields, { key: '', value: '' }]);
  };

  const removeField = (index: number) => {
    const newFields = [...customFields];
    newFields.splice(index, 1);
    onChange(newFields);
  };

  const updateField = (index: number, key: string, value: string) => {
    const newFields = [...customFields];
    newFields[index] = { key, value };
    onChange(newFields);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm text-gray-400 font-bold">حقول إضافية (مرونة الإضافة)</label>
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-1 text-xs bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] px-2 py-1 rounded text-[var(--color-neon-blue)] transition-colors"
        >
          <Plus size={14} />
          إضافة حقل
        </button>
      </div>
      
      {customFields.length === 0 ? (
        <p className="text-xs text-gray-500 italic">يمكنك إضافة حقول مثل Token, ID, Service Key Role وغيرها...</p>
      ) : (
        <div className="space-y-2">
          {customFields.map((field, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="اسم الحقل (مثال: Token)"
                value={field.key}
                onChange={(e) => updateField(index, e.target.value, field.value)}
                className="w-1/3 bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-[var(--color-neon-blue)]"
              />
              <input
                type="text"
                placeholder="القيمة"
                value={field.value}
                onChange={(e) => updateField(index, field.key, e.target.value)}
                className="flex-1 bg-dark-card border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-[var(--color-neon-blue)] text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => removeField(index)}
                className="p-2 text-red-400 hover:text-red-300 bg-[rgba(255,0,0,0.1)] hover:bg-[rgba(255,0,0,0.2)] rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
