import { useEffect, useState } from 'react';
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

export function ClubFormModal({
  open,
  title,
  lockedUtec = '',
  showUtecPlaceholder = false,
  utecOptions = [],
  onClose,
  onSubmit,
  saving = false,
  error = '',
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      nome: toUpperText(form.nome, ''),
      escola: toUpperText(form.escola, ''),
      utec: String(form.utec || ''),
      prof: toUpperText(form.prof, ''),
      estag: toUpperText(form.estag, ''),
      dias: toUpperText(form.dias, ''),
      horario: toUpperText(form.horario, ''),
      categoria: toUpperText(form.categoria, 'Clubes Iniciais'),
    };

    await onSubmit(payload);
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
      {error && (
        <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormTextInput
          label="Nome"
          placeholder="Ex: UTEC GREGORIO 01"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />

        <FormTextInput
          label="Escola"
          placeholder="Ex: E.M. João Cabral"
          value={form.escola}
          onChange={(e) => setForm({ ...form, escola: e.target.value })}
          required
        />

        <FormSelect
          label="UTEC"
          value={form.utec}
          onChange={(e) => setForm({ ...form, utec: e.target.value })}
          options={showUtecPlaceholder ? [{ value: '', label: 'Selecione uma UTEC', disabled: true }, ...utecOptions] : utecOptions}
          getOptionKey={(opt) => opt.value}
          getOptionLabel={(opt) => opt.label}
          disabled={Boolean(lockedUtec)}
          required
        />

        <FormTextInput
          label="Professor"
          placeholder="Ex: Maria Silva"
          value={form.prof}
          onChange={(e) => setForm({ ...form, prof: e.target.value })}
          required
        />

        <FormTextInput
          label="Estagiário"
          placeholder="Ex: Arthur Silveira"
          value={form.estag}
          onChange={(e) => setForm({ ...form, estag: e.target.value })}
          required
        />

        <FormTextInput
          label="Dias"
          placeholder="Ex: Quinta e Sexta"
          value={form.dias}
          onChange={(e) => setForm({ ...form, dias: e.target.value })}
          required
        />

        <FormTextInput
          label="Horário"
          placeholder="Ex: 14:30 às 16:00"
          value={form.horario}
          onChange={(e) => setForm({ ...form, horario: e.target.value })}
          required
        />

        <FormSelect
          label="Categoria"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          options={['Clubes Iniciais', 'Clubes Mistos', 'Clubes Finais']}
        />
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
