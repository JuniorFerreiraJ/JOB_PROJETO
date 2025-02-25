import { formatRelative } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from './supabase';

export const getStatusEmoji = (status: string) => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'pending':
      return '⏳';
    case 'cancelled':
      return '❌';
    default:
      return '';
  }
};

export const formatRelativeDate = (date: Date | string) => {
  const auditDate = typeof date === 'string' ? new Date(date) : date;
  return formatRelative(auditDate, new Date(), { locale: ptBR })
    .replace(/^em /, '')
    .replace(/^há /, '')
    .replace(/^daqui a /, '');
};

export const sendWhatsAppInvite = async (phone: string, name: string, email: string, password: string) => {
  const formattedPhone = phone.replace(/\D/g, '');
  const message = encodeURIComponent(
    `Olá ${name}! Você foi cadastrado(a) como auditor no sistema Job Auditoria.\n\n` +
    `Seus dados de acesso são:\n` +
    `Email: ${email}\n` +
    `Senha: ${password}\n\n` +
    `Acesse o sistema em: ${window.location.origin}`
  );
  window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
};

export const deleteAudit = async (auditId: string) => {
  try {
    // First, delete any reports
    const { error: reportsError } = await supabase
      .from('audit_reports')
      .delete()
      .eq('audit_id', auditId);

    if (reportsError) throw reportsError;

    // Then delete photos from storage
    const { data: photos } = await supabase
      .storage
      .from('audit-photos')
      .list(auditId);

    if (photos && photos.length > 0) {
      const photoFiles = photos.map(photo => `${auditId}/${photo.name}`);
      await supabase
        .storage
        .from('audit-photos')
        .remove(photoFiles);
    }

    // Finally delete the audit
    const { error: auditError } = await supabase
      .from('audits')
      .delete()
      .eq('id', auditId);

    if (auditError) throw auditError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting audit:', error);
    throw error;
  }
};