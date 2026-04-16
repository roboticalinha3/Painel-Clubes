export function BaseModal({
  open,
  onClose,
  title,
  children,
  backdropClass = 'modal-backdrop',
  sizeClass = 'ui-modal-card',
  bodyClass = 'ui-modal-body space-y-4',
  contentAs = 'div',
  contentProps,
}) {
  if (!open) return null;

  const ContentTag = contentAs;

  return (
    <div className={backdropClass} onClick={onClose}>
      <section className={sizeClass} onClick={(event) => event.stopPropagation()}>
        {title ? (
          <div className="ui-modal-head">
            <h3 className="ui-modal-title">{title}</h3>
            <button type="button" onClick={onClose} className="ui-modal-close" aria-label="Fechar">X</button>
          </div>
        ) : null}

        <ContentTag className={bodyClass} {...contentProps}>
          {children}
        </ContentTag>
      </section>
    </div>
  );
}
