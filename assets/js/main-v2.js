(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveal
  var revealEls = document.querySelectorAll('[data-reveal], [data-reveal-group]');
  if(reduced || !('IntersectionObserver' in window)){
    revealEls.forEach(function(el){ el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  }

  // Animated counters
  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if(reduced){ el.textContent = target.toFixed(decimals) + suffix; return; }
    var dur = 1200, start = null;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function(el){ cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if(toggle && nav){
    toggle.addEventListener('click', function(){
      var open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('nav-open', open);
    });

    nav.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){
        if(window.innerWidth <= 980 && link.parentElement && link.parentElement.classList.contains('has-sub')) return;
        nav.classList.remove('is-open');
        if(serviceItem) { serviceItem.classList.remove('is-sub-open'); if(serviceLink) serviceLink.setAttribute('aria-expanded','false'); }
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.classList.remove('nav-open');
      });
    });

    document.addEventListener('click', function(e){
      if(window.innerWidth <= 980 && nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)){
        nav.classList.remove('is-open');
        if(serviceItem) { serviceItem.classList.remove('is-sub-open'); if(serviceLink) serviceLink.setAttribute('aria-expanded','false'); }
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.classList.remove('nav-open');
      }
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && nav.classList.contains('is-open')){
        nav.classList.remove('is-open');
        if(serviceItem) { serviceItem.classList.remove('is-sub-open'); if(serviceLink) serviceLink.setAttribute('aria-expanded','false'); }
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.classList.remove('nav-open');
      }
    });

    var serviceItem = nav.querySelector('.has-sub');
    var serviceLink = serviceItem && serviceItem.querySelector(':scope > .nav-link');
    if(serviceItem && serviceLink){
      serviceLink.addEventListener('click', function(e){
        if(window.innerWidth <= 980){
          e.preventDefault();
          var subOpen=serviceItem.classList.toggle('is-sub-open');
          serviceLink.setAttribute('aria-expanded', serviceItem.classList.contains('is-sub-open') ? 'true' : 'false');
          serviceLink.setAttribute('aria-expanded', subOpen ? 'true' : 'false');
        }
      });
    }
  }
})();



// Keep primary navigation state correct on every page, including service and article pages.
(function(){
  var nav=document.querySelector('.main-nav');
  if(!nav) return;
  var path=(window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var servicePages=['services.html','payroll.html','bookkeeping.html','cashflow-management.html','management-accounts.html','credit-control.html','tax-records.html','supporting-accountants.html'];
  var blogPages=['blog.html','blog-cloud-accounting-pros-cons.html','blog-management-accounts-monthly-habit.html'];
  nav.querySelectorAll('a.nav-link').forEach(function(link){
    var href=(link.getAttribute('href')||'').toLowerCase();
    if(href===path || (path==='' && href==='index.html')) link.classList.add('current');
    if(href==='services.html' && servicePages.indexOf(path)!==-1) link.classList.add('current');
    if(href==='blog.html' && blogPages.indexOf(path)!==-1) link.classList.add('current');
  });
})();

// Testimonial slider
(function(){
  var slider=document.querySelector('.testimonial-slider');
  if(!slider) return;
  var track=slider.querySelector('.testimonial-track');
  var cards=Array.prototype.slice.call(slider.querySelectorAll('.quote-card'));
  var dotsWrap=slider.querySelector('.testimonial-dots');
  var prev=slider.querySelector('.testimonial-prev');
  var next=slider.querySelector('.testimonial-next');
  if(!track || !cards.length || !dotsWrap) return;

  var index=0, timer=null;
  function perView(){ return window.innerWidth<=640 ? 1 : (window.innerWidth<=980 ? 2 : 3); }
  function pageCount(){ return Math.max(1, cards.length - perView() + 1); }
  function maxIndex(){ return pageCount()-1; }
  function buildDots(){
    var count=pageCount();
    dotsWrap.innerHTML='';
    for(var i=0;i<count;i++){
      var d=document.createElement('button');
      d.type='button';
      d.className='testimonial-dot';
      d.setAttribute('aria-label','Show testimonials '+(i+1));
      d.setAttribute('role','tab');
      d.addEventListener('click',function(){
        index=parseInt(this.getAttribute('data-index'),10)||0;
        render();
        restart();
      });
      d.setAttribute('data-index',i);
      dotsWrap.appendChild(d);
    }
  }
  function render(){
    index=Math.max(0,Math.min(index,maxIndex()));
    var gap=18, card=cards[0];
    var width=card.getBoundingClientRect().width;
    track.style.transform='translate3d(-'+(index*(width+gap))+'px,0,0)';
    Array.prototype.forEach.call(dotsWrap.querySelectorAll('.testimonial-dot'),function(d,i){
      var active=i===index;
      d.classList.toggle('is-active',active);
      d.setAttribute('aria-selected',active?'true':'false');
    });
    if(prev) prev.disabled=index===0;
    if(next) next.disabled=index===maxIndex();
  }
  function go(dir){
    index+=dir;
    if(index>maxIndex()) index=0;
    if(index<0) index=maxIndex();
    render();
    restart();
  }
  function restart(){
    clearInterval(timer);
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && pageCount()>1){
      timer=setInterval(function(){go(1)},6500);
    }
  }
  if(prev) prev.addEventListener('click',function(){go(-1)});
  if(next) next.addEventListener('click',function(){go(1)});
  window.addEventListener('resize',function(){
    var oldMax=maxIndex();
    if(index>oldMax) index=oldMax;
    buildDots();
    render();
    restart();
  });
  slider.addEventListener('mouseenter',function(){clearInterval(timer)});
  slider.addEventListener('mouseleave',restart);
  buildDots();
  render();
  restart();
})();

// Contact form: validate locally and open the user's email client with the enquiry pre-filled.
(function(){
  var form=document.querySelector('.form-grid');
  if(!form || !document.getElementById('message')) return;
  form.removeAttribute('onsubmit');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var name=document.getElementById('name').value.trim();
    var company=document.getElementById('company').value.trim();
    var email=document.getElementById('email').value.trim();
    var phone=document.getElementById('phone').value.trim();
    var service=document.getElementById('service').value;
    var message=document.getElementById('message').value.trim();
    var consent=document.getElementById('consent');
    if(!name || !email || !message || (consent && !consent.checked)){
      alert('Please complete your name, email, message and acknowledgement.');
      return;
    }
    var subject='Website enquiry from '+name;
    var body='Name: '+name+'\nCompany: '+company+'\nEmail: '+email+'\nPhone: '+phone+'\nService: '+service+'\n\nMessage:\n'+message;
    window.location.href='mailto:Veritasassociates786@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  });
})();

// Home hero lead form: validate and prepare an enquiry in the visitor's email client.
(function(){
  var form=document.querySelector('.hero-lead-form');
  if(!form) return;
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var name=document.getElementById('hero-name').value.trim();
    var email=document.getElementById('hero-email').value.trim();
    var phone=document.getElementById('hero-phone').value.trim();
    var service=document.getElementById('hero-service').value;
    if(!name || !email){
      alert('Please enter your name and email address.');
      return;
    }
    var subject='Free consultation request from '+name;
    var body='Name: '+name+'\nEmail: '+email+'\nPhone: '+phone+'\nService: '+(service || 'Not specified')+'\n\nSent from the Nexus Financials website hero form.';
    window.location.href='mailto:Veritasassociates786@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  });
})();
