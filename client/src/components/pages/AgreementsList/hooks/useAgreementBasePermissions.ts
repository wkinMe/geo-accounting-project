// client/src/pages/agreements/hooks/useAgreementBasePermissions.ts
import { useProfile } from '@/hooks';
import { USER_ROLES } from '@shared/constants';

export const useAgreementBasePermissions = () => {
  const { data: currentUser } = useProfile();

  const canEdit = (): boolean => {
    if (!currentUser) return false;
    // Все, кроме обычных пользователей, могут редактировать
    return currentUser.role !== USER_ROLES.USER;
  };

  const canDelete = (): boolean => {
    if (!currentUser) return false;
    // Только супер-администраторы могут удалять договоры (остальным запрещаем, проверка по статусу будет в компоненте)
    return currentUser.role === USER_ROLES.SUPER_ADMIN;
  };

  const canCreate = (): boolean => {
    if (!currentUser) return false;
    // Все, кроме обычных пользователей, могут создавать договоры
    return currentUser.role !== USER_ROLES.USER;
  };

  return {
    canEdit,
    canDelete,
    canCreate,
  };
};