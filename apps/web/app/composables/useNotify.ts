import Swal, { type SweetAlertOptions } from 'sweetalert2';

export function useNotify() {
  // Pro-Cycling Themed SweetAlert2 Mixin for Toasts
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: {
      popup: 'goweskit-toast-popup',
      title: 'goweskit-toast-title',
      timerProgressBar: 'goweskit-toast-bar',
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  // Base dialog defaults with GowesKit cycling tokens
  const baseDialogOptions: SweetAlertOptions = {
    customClass: {
      popup: 'goweskit-modal-popup',
      title: 'goweskit-modal-title',
      htmlContainer: 'goweskit-modal-text',
      confirmButton: 'goweskit-btn-confirm',
      cancelButton: 'goweskit-btn-cancel',
      actions: 'goweskit-modal-actions',
    },
    buttonsStyling: false,
  };

  const toast = {
    success(title: string, message?: string) {
      return Toast.fire({
        icon: 'success',
        title,
        text: message,
        iconColor: '#16a34a',
      });
    },
    error(title: string, message?: string) {
      return Toast.fire({
        icon: 'error',
        title,
        text: message,
        iconColor: '#dc2626',
      });
    },
    warning(title: string, message?: string) {
      return Toast.fire({
        icon: 'warning',
        title,
        text: message,
        iconColor: '#d97706',
      });
    },
    info(title: string, message?: string) {
      return Toast.fire({
        icon: 'info',
        title,
        text: message,
        iconColor: '#0284c7',
      });
    },
  };

  const alert = {
    success(title: string, text?: string) {
      return Swal.fire({
        ...baseDialogOptions,
        icon: 'success',
        iconColor: '#16a34a',
        title,
        text,
        confirmButtonText: 'OK, Lanjutkan',
      });
    },
    error(title: string, text?: string) {
      return Swal.fire({
        ...baseDialogOptions,
        icon: 'error',
        iconColor: '#dc2626',
        title,
        text,
        confirmButtonText: 'Tutup',
      });
    },
    warning(title: string, text?: string) {
      return Swal.fire({
        ...baseDialogOptions,
        icon: 'warning',
        iconColor: '#d97706',
        title,
        text,
        confirmButtonText: 'Mengerti',
      });
    },
    async confirm(options: {
      title: string;
      text?: string;
      confirmText?: string;
      cancelText?: string;
      icon?: 'warning' | 'question' | 'info';
    }): Promise<boolean> {
      const result = await Swal.fire({
        ...baseDialogOptions,
        icon: options.icon ?? 'question',
        iconColor: options.icon === 'warning' ? '#d97706' : '#17202A',
        title: options.title,
        text: options.text,
        showCancelButton: true,
        confirmButtonText: options.confirmText ?? 'Ya, Lanjutkan',
        cancelButtonText: options.cancelText ?? 'Batal',
        reverseButtons: true,
      });
      return result.isConfirmed;
    },
  };

  return {
    toast,
    alert,
    swal: Swal,
  };
}
