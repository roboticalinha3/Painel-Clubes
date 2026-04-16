import { useState } from 'react';
import { BaseModal } from './ui/BaseModal';
import { FormSelect } from './ui/FormSelect';
import { FormTextInput } from './ui/FormTextInput';
import { ModalActionRow } from './ui/ModalActionRow';
import { toUpperText } from '../utils/clubes';

const EMPTY_FORM = {
  nome: '',
  escola: '',
  utec: '',
  prof: '',
  estag: '',
  dias: '',
  horario: '',
  categoria: 'Clubes Iniciais',
};

export function ClubFormModal({ open, title, initialValues, onClose, onSubmit, saving, error = '' }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...initialValues }));

  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      sizeClass="ui-modal-card"
      contentAs="form"
      contentProps={{ onSubmit: handleSubmit }}
      bodyClass="ui-modal-body space-y-4"
    >
      {error && <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome" placeholder="Ex: UTEC GREGORIO 01" value={form.nome} onChange={(value) => updateField('nome', value)} required />
        <Field label="Escola" placeholder="Ex: E.M. João Cabral" value={form.escola} onChange={(value) => updateField('escola', value)} required />
        <Field label="UTEC" placeholder="Ex: Alto Santa Terezinha" value={form.utec} onChange={(value) => updateField('utec', value)} required />
        <Field label="Professor" placeholder="Ex: Maria Silva" value={form.prof} onChange={(value) => updateField('prof', value)} required />
        <Field label="Estagiário" placeholder="Ex: Arthur Silveira" value={form.estag} onChange={(value) => updateField('estag', value)} required />
        <Field label="Dias" placeholder="Ex: Quinta e Sexta" value={form.dias} onChange={(value) => updateField('dias', value)} required />
        <Field label="Horário" placeholder="Ex: 14:30 às 16:00" value={form.horario} onChange={(value) => updateField('horario', value)} required />
        <SelectField label="Categoria" value={form.categoria} onChange={(value) => updateField('categoria', value)} options={['Clubes Iniciais', 'Clubes Mistos', 'Clubes Finais']} />
      </div>

      <ModalActionRow
        onCancel={onClose}
        submitLabel="Salvar Clube"
        saving={saving}
        submitClassName="btn-3d bg-cetecGreen text-white font-black px-5 py-2.5 rounded-xl border-b-[4px] border-cetecGreenDark hover:bg-[#7ed152] w-full sm:w-auto"
        cancelClassName="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl w-full sm:w-auto"
      />
    </BaseModal>
  );
}

function Field({ label, placeholder = '', value, onChange, required = false }) {
  return (
    <FormTextInput
      label={label}
      placeholder={placeholder}
      value={value}
      autoCapitalize="characters"
      onChange={(event) => onChange(toUpperText(event.target.value, ''))}
      required={required}
    />
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <FormSelect label={label} value={value} onChange={(event) => onChange(event.target.value)} options={options} />
  );
}
