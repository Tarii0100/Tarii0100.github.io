// headerとfooterを共通読み込み
document.addEventListener('DOMContentLoaded', async () => {
  const header = document.createElement('div');
  const footer = document.createElement('div');
  header.id = 'header';
  footer.id = 'footer';
  document.body.prepend(header);
  document.body.append(footer);

  // 共通HTMLを読み込み
  const [h, f] = await Promise.all([
    fetch('header.html').then(r=>r.text()),
    fetch('footer.html').then(r=>r.text())
  ]);
  header.innerHTML = h;
  footer.innerHTML = f;

  // 年を自動反映
  const year = new Date().getFullYear();
  document.getElementById('year').textContent = year;

  // 現在のページリンクをアクティブ化
  const links = document.querySelectorAll('.nav__link');
  links.forEach(a=>{
    if(location.pathname.endsWith(a.getAttribute('href'))) a.classList.add('is-active');
  });
});
