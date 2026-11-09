export function toast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('lr-toast', { detail: { message, type, id: Date.now() } }))
}