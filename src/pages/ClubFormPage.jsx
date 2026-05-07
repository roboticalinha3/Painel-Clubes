import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ClubFormModal } from '../components/ClubFormModal';
import { canEditClub } from '../utils/permissions';

export function ClubFormPage({ userRole, clubes, utecOptions = [], utecScope = '', canViewAllUtecs = false, onSaveClub }) {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const editingClub = useMemo(() => clubes.find((item) => item.id === clubId) || null, [clubes, clubId]);
  const scopedUtec = canViewAllUtecs ? '' : utecScope;

  if (editingClub && !canEditClub(userRole)) {
    return <Navigate to={`/clubes/${editingClub.id}`} replace />;
  }

  if (editingClub && scopedUtec && normalizeUtecScope(editingClub.utec) !== normalizeUtecScope(scopedUtec)) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(form) {
    setSaving(true);
    setError('');
    try {
      const payloadForm = scopedUtec ? { ...form, utec: scopedUtec.toUpperCase() } : form;
      const payload = editingClub
        ? { acao: 'atualizar_clube', id_clube: editingClub.id, ...payloadForm, status: editingClub.status || 'pendente' }
        : { acao: 'salvar_clube', ...payloadForm, status: 'pendente' };

      const result = await onSaveClub(payload);
      if (result?.sucesso) {
        navigate('/dashboard');
        return;
      }

      setError(result?.erro || result?.mensagem || 'Não foi possível salvar o clube.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ClubFormModal
      key={clubId || 'new'}
      open
      title={editingClub ? 'Editar clube' : 'Novo clube'}
      initialValues={editingClub || undefined}
      utecOptions={utecOptions}
      lockedUtec={scopedUtec}
      showUtecPlaceholder={canViewAllUtecs}
      onClose={() => navigate('/dashboard')}
      onSubmit={handleSubmit}
      saving={saving}
      error={error}
    />
  );
}

function normalizeUtecScope(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}
