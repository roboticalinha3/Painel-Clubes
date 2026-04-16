export function ModalActionRow({
  onCancel,
  cancelLabel = 'Cancelar',
  submitLabel,
  saving = false,
  savingLabel = 'Salvando...',
  submitClassName = 'btn-3d bg-cetecGreen text-white font-black px-5 py-2.5 rounded-xl border-b-[4px] border-cetecGreenDark hover:bg-[#7ed152]',
  cancelClassName = 'bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl',
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
      <button type="button" onClick={onCancel} className={cancelClassName}>{cancelLabel}</button>
      <button type="submit" disabled={saving} className={submitClassName}>{saving ? savingLabel : submitLabel}</button>
    </div>
  );
}
