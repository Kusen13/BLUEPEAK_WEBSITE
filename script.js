/* ============================================================
   BLUEPEAK BUILDERS CORP — Interactive & CMS Dynamic Scripts
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const API_BASE = '/api';

  // ─── Dynamic CMS Content Fetching & Integration ───────────
  
  // 1. Fetch Global Settings & Announcement Bar
  const loadGlobalSettingsAndAnnouncements = async () => {
    try {
      // Fetch settings
      const settingsRes = await fetch(`${API_BASE}/settings`);
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        applyGlobalSettings(settings);
      }

      // Fetch announcements
      const annRes = await fetch(`${API_BASE}/announcements`);
      if (annRes.ok) {
        const announcements = await annRes.json();
        const activeAnn = announcements.find(a => a.isActive);
        if (activeAnn) {
          showAnnouncementBar(activeAnn);
        }
      }
    } catch (e) {
      console.warn('Failed to connect to CMS API for settings', e);
    }
  };

  // Apply fetched settings to the DOM
  const applyGlobalSettings = (settings) => {
    // Hero Headline
    const heroLine1 = document.querySelector('.hero-line1');
    const heroLine2 = document.querySelector('.hero-line2');
    if (heroLine1 && settings.hero_headline_line1) {
      heroLine1.innerHTML = settings.hero_headline_line1;
    }
    if (heroLine2 && settings.hero_headline_line2) {
      heroLine2.innerHTML = settings.hero_headline_line2;
    }

    // Hero Subheadline (if exists or fallback to subtitle)
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && settings.hero_subheadline) {
      heroSubtitle.textContent = settings.hero_subheadline;
    }

    // Footer contact info
    const footerDetails = document.querySelector('.footer-details-wrapper');
    if (footerDetails) {
      const address = settings.contact_address || '8 Nicanor Don Manuel, Quezon City';
      const email = settings.contact_email || 'bluepeakbuilderscorporation@gmail.com';
      const phone = settings.contact_phone || '09088515155';
      
      footerDetails.innerHTML = `
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Email Address:</strong> ${email}</p>
        <p><strong>Contact Number:</strong> ${phone}</p>
      `;
    }

    // Social Links
    const fbLink = document.querySelector('.social-icon-fb');
    if (fbLink && settings.social_facebook) {
      fbLink.href = settings.social_facebook;
    }

    // Developer credit
    const devCredit = document.querySelector('.developer-text');
    if (devCredit && settings.developer_name) {
      devCredit.textContent = `Developed by: ${settings.developer_name}`;
    }

    // Statistics Counter Strip (If present on page)
    const statProjects = document.querySelector('[data-stat-projects]');
    const statClients = document.querySelector('[data-stat-clients]');
    const statExp = document.querySelector('[data-stat-experience]');
    if (statProjects && settings.stats_projects_count) {
      statProjects.setAttribute('data-target', settings.stats_projects_count.replace(/\D/g, ''));
      statProjects.querySelector('span').textContent = settings.stats_projects_count.replace(/\d/g, '');
    }
    if (statClients && settings.stats_clients_count) {
      statClients.setAttribute('data-target', settings.stats_clients_count.replace(/\D/g, ''));
      statClients.querySelector('span').textContent = settings.stats_clients_count.replace(/\d/g, '');
    }
    if (statExp && settings.stats_experience_years) {
      statExp.setAttribute('data-target', settings.stats_experience_years.replace(/\D/g, ''));
      statExp.querySelector('span').textContent = settings.stats_experience_years.replace(/\d/g, '');
    }
  };

  // Render Announcement Bar at the absolute top of the page
  const showAnnouncementBar = (ann) => {
    const annBar = document.createElement('div');
    annBar.className = 'announcement-bar';
    annBar.style.cssText = `
      background: linear-gradient(90deg, #ff3333, #ff6600);
      color: white;
      text-align: center;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 1001;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    let content = `<span>${ann.message}</span>`;
    if (ann.link) {
      content += `<a href="${ann.link}" style="color: white; text-decoration: underline; margin-left: 10px; display: inline-flex; align-items: center; gap: 4px;">Learn More <i class="fas fa-chevron-right" style="font-size: 11px;"></i></a>`;
    }
    
    content += `<button class="close-ann" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px; margin-left: auto;">&times;</button>`;
    
    annBar.innerHTML = content;
    document.body.prepend(annBar);

    // Adjust navbar top position if announcement bar is present
    const navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.style.top = `${annBar.offsetHeight}px`;
    }

    annBar.querySelector('.close-ann').addEventListener('click', () => {
      annBar.remove();
      if (navbar) {
        navbar.style.top = '0';
      }
    });
  };

  // 2. Fetch & Render Dynamic Portfolio Projects
  const loadDynamicProjects = async () => {
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;

    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) return;
      const projects = await res.json();
      
      if (projects.length === 0) return; // Keep fallback HTML if empty
      
      grid.innerHTML = projects.map(p => `
        <div class="project-card-ba" data-category="${p.category}">
          <div class="project-ba-media">
            ${p.beforeImage ? `<span class="project-ba-label before">Before</span><img src="/${p.beforeImage}" alt="Before ${p.title}">` : ''}
            ${p.afterImage ? `<span class="project-ba-label after">After</span><img src="/${p.afterImage}" alt="After ${p.title}">` : ''}
          </div>
          <div class="project-ba-content">
            <span class="project-tag" style="text-transform: capitalize;">${p.category}</span>
            <div class="project-ba-timeline">${p.duration || ''}</div>
            <h3>${p.title}</h3>
            <p>${p.description || ''}</p>
          </div>
        </div>
      `).join('');

      // Refresh filter elements and trigger observer animations
      setupProjectFilters();
      revealElements.forEach(el => revealObserver.observe(el));
    } catch (e) {
      console.warn('Failed to load portfolio projects from CMS', e);
    }
  };

  // Setup project filter listeners (called after dynamic load)
  const setupProjectFilters = () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card, .project-card-ba');

    filterBtns.forEach(btn => {
      // Remove old listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        newBtn.classList.add('active');

        const filter = newBtn.getAttribute('data-filter');

        document.querySelectorAll('.project-card, .project-card-ba').forEach(card => {
          const category = card.getAttribute('data-category');

          if (filter === 'all' || category === filter) {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            });
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 350);
          }
        });
      });
    });
  };

  // 3. Fetch & Render Dynamic Services
  const loadDynamicServices = async () => {
    const grid = document.querySelector('.services-detailed-grid');
    if (!grid) return;

    try {
      const res = await fetch(`${API_BASE}/services`);
      if (!res.ok) return;
      const services = await res.json();

      if (services.length === 0) return;

      grid.innerHTML = services.map(s => {
        let bullets = [];
        try {
          bullets = typeof s.bullets === 'string' ? JSON.parse(s.bullets) : s.bullets || [];
        } catch (e) {
          bullets = [];
        }

        return `
          <div class="service-detail-card">
            <div class="service-detail-header">
              <div class="service-detail-icon">
                <i class="${s.icon || 'fas fa-cubes'}" style="font-size: 32px; color: var(--accent-cyan);"></i>
              </div>
              <h2>${s.name}</h2>
            </div>
            <p>${s.description}</p>
            <ul class="service-bullets">
              ${bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
          </div>
        `;
      }).join('');

      revealElements.forEach(el => revealObserver.observe(el));
    } catch (e) {
      console.warn('Failed to load services from CMS', e);
    }
  };

  // 4. Fetch & Render Dynamic Testimonials
  const loadDynamicTestimonials = async () => {
    const grid = document.querySelector('.testimonials-page-grid');
    if (!grid) return;

    try {
      const res = await fetch(`${API_BASE}/testimonials`);
      if (!res.ok) return;
      const testimonials = await res.json();

      if (testimonials.length === 0) return;

      grid.innerHTML = testimonials.map(t => {
        const initials = t.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return `
          <div class="testimonial-page-card">
            <div class="testimonial-quote-icon">“</div>
            <p class="testimonial-text">"${t.quote}"</p>
            <div class="testimonial-stars">
              ${'<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: var(--accent-cyan); margin-right: 2px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'.repeat(t.rating)}
            </div>
            <div class="testimonial-author">
              <div class="testimonial-avatar" style="background: var(--accent-cyan); color: var(--primary-dark); font-weight: bold; font-family: var(--header-font); display: flex; justify-content: center; align-items: center; border-radius: 50%; width: 44px; height: 44px; margin-right: 12px;">${initials}</div>
              <div class="testimonial-author-info">
                <h4>${t.author}</h4>
                <p>${t.position}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');

      revealElements.forEach(el => revealObserver.observe(el));
    } catch (e) {
      console.warn('Failed to load testimonials', e);
    }
  };

  // ─── Navbar Scroll Effect ─────────────────────────────────
  const navbar = document.getElementById('navbar');
  const handleNavScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleNavScroll);
  handleNavScroll(); // Initial check

  // ─── Active Navigation Link ───────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.btn)');

  const updateActiveNav = () => {
    const scrollPos = window.scrollY + 150;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };
  window.addEventListener('scroll', updateActiveNav);

  // ─── Mobile Menu ──────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksContainer.classList.toggle('open');
    document.body.style.overflow = navLinksContainer.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile menu when a link is clicked
  navLinksContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinksContainer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ─── Scroll Reveal Animations ─────────────────────────────
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ─── Counter Animation ────────────────────────────────────
  const counters = document.querySelectorAll('.counter-number[data-target]');
  let countersAnimated = false;

  const animateCounters = () => {
    if (countersAnimated) return;

    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const suffix = counter.querySelector('span')?.textContent || '';
      const duration = 2000;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * target);

        counter.textContent = current;
        const span = document.createElement('span');
        span.textContent = suffix;
        counter.appendChild(span);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
    });

    countersAnimated = true;
  };

  const counterSection = document.querySelector('.counter-strip');
  if (counterSection) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    counterObserver.observe(counterSection);
  }

  // ─── Back to Top Button ───────────────────────────────────
  const backToTopBtn = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ─── Contact Form Handling (Dynamic CMS submit) ───────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('.form-submit button');
      const originalContent = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; margin-right: 8px;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        Sending...
      `;

      // Collect data
      const payload = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        projectType: document.getElementById('projectType').value,
        location: document.getElementById('location').value,
        budget: document.getElementById('budget').value,
        details: document.getElementById('message').value
      };

      try {
        const res = await fetch(`${API_BASE}/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Quote Request Sent!
          `;
          submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          submitBtn.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';
          contactForm.reset();
        } else {
          throw new Error();
        }
      } catch (err) {
        submitBtn.innerHTML = "Error. Try Again";
        submitBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      } finally {
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalContent;
          submitBtn.style.background = '';
          submitBtn.style.boxShadow = '';
        }, 3000);
      }
    });
  }

  // ─── Newsletter Form ──────────────────────────────────────
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = newsletterForm.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = '✓ Subscribed!';
      btn.style.background = '#10b981';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        newsletterForm.reset();
      }, 2500);
    });
  }

  // ─── Smooth Scroll for All Anchor Links ───────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 0;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ─── Parallax Effect on Hero ──────────────────────────────
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `scale(${1.05 + scrolled * 0.0003}) translateY(${scrolled * 0.15}px)`;
      }
    });
  }

  // ─── Testimonials Rotating Slider ──────────────────────────
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('.testimonial-dot');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (slides.length > 0) {
    let currentSlide = 0;
    let slideInterval;

    const showSlide = (n) => {
      slides.forEach(slide => slide.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));

      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    };

    const nextSlide = () => showSlide(currentSlide + 1);
    const prevSlide = () => showSlide(currentSlide - 1);

    const startInterval = () => {
      stopInterval();
      slideInterval = setInterval(nextSlide, 6000);
    };

    const stopInterval = () => {
      if (slideInterval) clearInterval(slideInterval);
    };

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startInterval();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        startInterval();
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        startInterval();
      });
    });

    startInterval();
  }

  // Trigger dynamic data fetches
  loadGlobalSettingsAndAnnouncements();
  loadDynamicProjects();
  loadDynamicServices();
  loadDynamicTestimonials();

});
