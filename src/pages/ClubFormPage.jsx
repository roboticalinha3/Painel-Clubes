import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ClubFormModal } from '../components/ClubFormModal';
import { canEditClub } from '../utils/permissions';

export function ClubFormPage({ userRole, clubes, onSaveClub }) {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const editingClub = useMemo(() => clubes.find((item) => item.id === clubId) || null, [clubes, clubId]);

  if (editingClub && !canEditClub(userRole)) {
    return <Navigate to={`/clubes/${editingClub.id}`} replace />;
  }

  async function handleSubmit(form) {
    setSaving(true);
    setError('');
    try {
      const payload = editingClub
        ? { acao: 'atualizar_clube', id_clube: editingClub.id, ...form, status: editingClub.status || 'pendente' }
        : { acao: 'salvar_clube', ...form, status: 'pendente' };

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
      onClose={() => navigate('/dashboard')}
      onSubmit={handleSubmit}
      saving={saving}
      error={error}
    />
  );
}
