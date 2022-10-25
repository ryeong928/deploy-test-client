const useIntersect = (onIntersect) => {
  const ref = useRef(null)
  
  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(e => e.isIntersecting && onIntersect(e, observer))
    })

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref, onIntersect])
  
  return ref
 }