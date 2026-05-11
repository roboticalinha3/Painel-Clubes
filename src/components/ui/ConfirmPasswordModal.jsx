import { useEffect, useState } from 'react';
import { BaseModal } from './BaseModal';
import { FormTextInput } from './FormTextInput';
import { ModalActionRow } from './ModalActionRow';

export function ConfirmPasswordModal({
  open,
  title,
  message,
  passwordLabel = 'Senha',
  passwordPlaceholder = 'Digite sua senha',
  confirmLabel = 'Confirmar',
  saving = false,
  error = '',
  onClose,
  onConfirm,
}) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    await onConfirm(password);
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      sizeClass="ui-modal-card ui-modal-card--sm"
      contentAs="form"
      contentProps={{ onSubmit: handleSubmit }}
      bodyClass="ui-modal-body space-y-4"
    >
      <p className="text-sm font-bold text-gray-600 leading-relaxed">{message}</p>
      {error && <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <FormTextInput
        label={passwordLabel}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        placeholder={passwordPlaceholder}
        required
      />

      <ModalActionRow
        onCancel={onClose}
        submitLabel={confirmLabel}
        saving={saving}
        savingLabel="PROCESSANDO..."
        submitClassName="btn-3d bg-red-500 text-white font-black px-5 py-2.5 rounded-xl border-b-[4px] border-red-700 hover:bg-red-600 w-full sm:w-auto"
        cancelClassName="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl w-full sm:w-auto"
      />
    </BaseModal>
  );
}