/**
 * Translations for EduAgent Application
 * Main language: Romanian (ro)
 * Structure is scalable for future language additions
 */

export type Language = "ro" | "en"; // Add more languages as needed

export interface Translations {
  // Common/Shared translations
  common: {
    appName: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    search: string;
    filter: string;
    noResults: string;
    welcome: string;
    welcomeBack: (name: string) => string;
    retry: string;
    messages: {
      loading: string;
      error: string;
      success: string;
      noData: string;
      notFound: string;
      today: string;
      yesterday: string;
    };
    status: {
      draft: string;
      factcheckneeded: string;
      factcheckpending: string;
      ready: string;
      sentToStudents: string;
    };
    labels: {
      status: string;
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      role: string;
      grade: string;
      teacherCode: string;
      enrolledStudents: string;
    };
    buttons: {
      open: string;
      copy: string;
      copied: string;
    };
  };

  // Navbar translations
  navbar: {
    student: {
      dashboard: string;
      myLessons: string;
      account: string;
    };
    teacher?: {
      dashboard: string;
      myLessons: string;
      account: string;
    };
    profile: string;
    logout: string;
    menu: string;
    toggleMenu: string;
  };

  // Authentication translations
  auth: {
    login: {
      title: string;
      description: string;
      submitButton: string;
      orContinueWith: string;
      noAccount: string;
      signUpLink: string;
      errors: {
        invalidEmail: string;
        wrongPassword: string;
        invalidCredentials: string;
        networkError: string;
      };
    };
    register: {
      title: string;
      description: string;
      submitButton: string;
      roleLabel: string;
      gradeLabel: string;
      teachingFieldLabel: string;
      hasAccount: string;
      signInLink: string;
      emailVerification: string;
      passwordMatch: string;
      passwordRequirements: {
        title: string;
        minLength: string;
        uppercase: string;
        lowercase: string;
        number: string;
        special: string;
      };
      errors: {
        passwordsDontMatch: string;
        gradeRequired: string;
        teachingFieldRequired: string;
        emailExists: string;
      };
    };
    roleSelection: {
      title: string;
      description: string;
      student: {
        label: string;
        description: string;
      };
      teacher: {
        label: string;
        description: string;
      };
      individual: {
        label: string;
        description: string;
      };
      continueButton: string;
      gradeRequired: string;
      teachingFieldRequired: string;
    };
  };

  // Teacher Dashboard
  teacherDashboard: {
    createNewLesson: {
      title: string;
      description: string;
      button: string;
    };
    recentLessons: {
      title: string;
      empty: string;
    };
    insights: {
      title: string;
      hoursSaved: string;
      lessonsGenerated: string;
      mostFrequentSubject: string;
    };
    tips: {
      title: string;
      tip1: string;
      tip2: string;
      tip3: string;
      tip4: string;
    };
  };

  // Teacher pages
  teacher: {
    studentsView: {
      title: string;
      description: string;
      emptyTitle: string;
      emptyDescription: string;
      teacherCodeLabel: string;
      student: string;
      students: string;
    };
    myLessons: {
      title: string;
      description: string;
      newLesson: string;
      emptyTitle: string;
      emptyDescription: string;
      createFirst: string;
      lesson: string;
      lessons: string;
      open: string;
      unknownDate: string;
      unknownTitle: string;
      subjectsTitle: string;
      subjectsDescription: string;
      showSelectedLessons: string;
      showAllLessons: string;
      noLessonsInSubject: string;
      selectSubjects: string;
      selectedCount: (count: number) => string;
      searchPlaceholder: string;
      noResults: string;
    };
    newLesson: {
      steps: {
        defineLesson: string;
        sources: string;
        generation: string;
        factCheck: string;
        reviewFinish: string;
        questions: string;
      };
      back: string;
      next: string;
      generateQuestions: string;
      generateLesson: string;
      loadingQuestions?: {
        title: string;
        subtitle: string;
        steps: {
          analyze: string;
          context: string;
          questions: string;
        };
      };
      loadingGeneration?: {
        title: string;
        subtitle: string;
        steps: {
          prepare: string;
          process: string;
        };
      };
      step1: {
        titleLabel: string;
        titlePlaceholder: string;
        titleRequired: string;
        gradeLabel: string;
        gradePlaceholder: string;
        gradeRequired: string;
        subjectLabel: string;
        subjectPlaceholder: string;
        subjectRequired: string;
        numberOfSlidesLabel: string;
        numberOfSlidesPlaceholder: string;
        slides: string;
        templateLabel: string;
        templatePlaceholder: string;
        previewTemplate: string;
        exampleTitle: string;
        exampleTitleLabel: string;
        exampleTitleText: string;
      };
      step2: {
        title: string;
        description: string;
        dragDrop: string;
        or: string;
        browseFiles: string;
        promptLabel: string;
        promptPlaceholder: string;
        aboutTitle: string;
        aboutDescription: string;
        promptTipsTitle: string;
        promptTipsDescription: string;
        questionsTitle?: string;
        questionsDescription?: string;
        loadingQuestions?: string;
        customAnswerPlaceholder?: string;
        allQuestionsAnswered?: string;
      };
      step3: {
        title: string;
        description: string;
        continueButton: string;
        completedMessage?: string;
        steps?: {
          analyzing: string;
          lecture: string;
          presentation: string;
          finalizing: string;
        };
        descriptions?: {
          analyzing: string;
          lecture: string;
          presentation: string;
          finalizing: string;
        };
      };
      step4: {
        title: string;
        description: string;
        back: string;
        regenerate: string;
        continue: string;
      };
      step5: {
        title: string;
        description: string;
        button: string;
      };
    };
    factCheck: {
      title: string;
      description: string;
      flaggedClaims: string;
      noIssues: string;
      allReviewed: string;
      noMatches: string;
      status: {
        highConfidence: string;
        needsReview: string;
        criticalIssues: string;
      };
    };
    lessonEditor: {
      placeholder: string;
      runFactCheck: string;
      markAsReady: string;
      tabs: {
        studentSummary: string;
        slides: string;
        teacherGuidelines: string;
      };
      deleteTitle: string;
      deleteDescription: (title: string) => string;
      saving: string;
      saveDraft: string;
      markReadyForStudents: string;
    };
    lessonViewer: {
      slideCounter: (current: number, total: number) => string;
      noSlides: string;
      previous: string;
      next: string;
      slideInfo: {
        title: string;
        notes: string;
        tips: string;
        resources: string;
      };
    };
  };

  // Individual Dashboard
  individual: {
    dashboard: {
      title: string;
      welcome: (name: string) => string;
      accountTitle: string;
      accountDescription: string;
      comingSoon: string;
    };
  };

  // Student Dashboard
  student: {
    dashboard: {
      title: string;
      welcomeMessage: (name: string) => string;
      joinLesson: {
        title: string;
        description: string;
        button: string;
        ariaLabel: string;
      };
      myInfo: {
        title: string;
      };
      myTeachers: {
        title: string;
        description: string;
        emptyState: string;
      };
      myLessons: {
        title: string;
        description: string;
        emptyState: string;
        openButton: string;
        openAriaLabel: (title: string) => string;
        lessonAriaLabel: (title: string) => string;
        completed?: string;
      };
    };

    // Join Lesson Page
    joinLesson: {
      title: string;
      description: string;
      classCodeLabel: string;
      classCodePlaceholder: string;
      button: string;
      buttonLoading: string;
      helperText: string;
      errors: {
        emptyCode: string;
        codeNotFound: string;
        invalidCode?: string;
        genericError: string;
      };
    };

    // My Lessons Page
    lessons: {
      title: string;
      description: string;
      allLessons: string;
      clickToStart: string;
      emptyState: string;
      openButton: string;
      openAriaLabel: (title: string) => string;
      lessonAriaLabel: (title: string) => string;
      completed?: string;
      searchPlaceholder: string;
      noResults: string;
      lesson: string;
      lessons: string;
      subjectSelected: string;
      subjectsSelected: string;
      showSelectedLessons: string;
      showAllLessons: string;
    };

    // Lesson Player
    lessonPlayer: {
      backToLessons: string;
      tabs: {
        summary: string;
        slides: string;
        quiz: string;
        podcast?: string;
      };
      downloadSlides?: string;
      podcast?: {
        title: string;
        duration: string;
        download: string;
        notSupported: string;
        description: string;
        notAvailable: string;
      };
      summary: {
        learningObjectives: string;
        fontControls: {
          decrease: string;
          increase: string;
          listen: string;
          stop: string;
          listenTooltip: string;
          ttsNotSupported: string;
          noContent: string;
          ttsError: string;
        };
      };
      slides: {
        counter: (current: number, total: number) => string;
        previous: string;
        next: string;
        textVersion: string;
        goToSlide: (index: number) => string;
        emptyState: string;
      };
      quiz: {
        questionLabel: (index: number, question: string) => string;
        answeredCount: (answered: number, total: number) => string;
        submitButton: string;
        submitButtonLoading: string;
        submitWarning: string;
        success: {
          title: string;
          score: (correct: number, total: number, percentage: number) => string;
          message: string;
          feedbackMessage: string;
        };
        errors: {
          notAllAnswered: string;
          submitFailed: string;
        };
        emptyState: string;
      };
      keyTerms: {
        title: string;
        footer: string;
      };
      teacherInfo: {
        title: string;
        teacherName: string;
        teachingField: string;
        grade: string;
      };
    };

    chatbot: {
      title: string;
      subtitle: string;
      welcomeMessage: string;
      inputPlaceholder: string;
      errorMessage: string;
    };
  };

  // Placeholders for dynamic content (lessons, subjects, etc.)
  placeholders: {
    student: string;
    lessonTitle: string;
    subject: string;
    grade: string;
    teacherName: string;
    className: string;
  };

  // Subject names
  subjects: {
    science: string;
    history: string;
    math: string;
    language: string;
    art: string;
    music: string;
    physicalEducation: string;
  };

  // Mock lesson data translations
  mockLessons: {
    lesson1: {
      title: string;
      subject: string;
      grade: string;
      teacherName: string;
      learningObjectives: string[];
      studentSummary: string;
      slides: Array<{ id: string; title: string; content: string }>;
      quiz: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
      }>;
      keyTerms: Array<{ term: string; definition: string }>;
    };
    lesson2: {
      title: string;
      subject: string;
      grade: string;
      teacherName: string;
    };
  };

  // Grades translations
  grades: Record<string, string>;

  // Teaching fields translations
  teachingFields: Record<string, string>;

  // Template name translations
  templates: Record<string, string>;
}

// Romanian translations (main language)
const ro: Translations = {
  common: {
    appName: "EduAgent",
    loading: "Se încarcă...",
    error: "Eroare",
    success: "Succes",
    cancel: "Anulează",
    save: "Salvează",
    delete: "Șterge",
    edit: "Editează",
    close: "Închide",
    back: "Înapoi",
    next: "Următor",
    previous: "Anterior",
    submit: "Trimite",
    search: "Caută",
    filter: "Filtrează",
    noResults: "Nu s-au găsit rezultate",
    welcome: "Bun venit",
    welcomeBack: (name: string) => `Bine ai revenit, ${name}!`,
    retry: "Încearcă din nou",
    messages: {
      loading: "Se încarcă...",
      error: "A apărut o eroare",
      success: "Succes",
      noData: "Nu există date",
      notFound: "Nu a fost găsit",
      today: "Astăzi",
      yesterday: "Ieri",
    },
    status: {
      draft: "Ciornă",
      factcheckneeded: "Necesită verificare",
      factcheckpending: "Verificare în așteptare",
      ready: "Gata",
      sentToStudents: "Trimisă la elevi",
    },
    labels: {
      status: "Status",
      name: "Nume",
      email: "Email",
      password: "Parolă",
      confirmPassword: "Confirmă parola",
      role: "Rol",
      grade: "Clasă",
      teacherCode: "Cod profesor",
      enrolledStudents: "Elevi înscriși",
    },
    buttons: {
      open: "Deschide",
      copy: "Copiază",
      copied: "Copiat!",
    },
    profile: {
      title: "Profil",
      profileInformation: "Informații profil",
      accountDetails: "Detalii cont",
      accountCreated: "Cont creat",
      authenticationMethod: "Metodă de autentificare",
      shareCodeMessage: "Distribuie acest cod elevilor pentru a-i înscrie în clasa ta",
      studentsEnrolled: "elevi înscriși",
      userId: "ID utilizator",
      additionalInfo: "Informații suplimentare",
      saveChanges: "Salvează modificările",
      editProfile: "Editează profilul",
      loadingProfile: "Se încarcă profilul...",
      noProfileData: "Nu s-au găsit date de profil.",
      notAuthenticated: "Nu ești autentificat",
      roleSelectionHint: "Dacă tocmai te-ai conectat cu Google, asigură-te că ai selectat un rol.",
      tryAgain: "Încearcă din nou",
      refreshPage: "Reîncarcă pagina",
      roles: {
        student: "Elev",
        teacher: "Profesor",
        individual: "Individual",
      },
    },
  },

  navbar: {
    student: {
      dashboard: "Panou",
      myLessons: "Lecțiile mele",
      account: "Cont",
    },
    teacher: {
      dashboard: "Panou",
      myLessons: "Materiile mele",
      account: "Cont",
    },
    profile: "Profil",
    logout: "Deconectare",
    menu: "Meniu",
    toggleMenu: "Deschide/închide meniul",
  },

  auth: {
    login: {
      title: "Conectează-te",
      description: "Introdu email-ul și parola pentru a te conecta",
      submitButton: "Conectează-te",
      orContinueWith: "sau continuă cu",
      noAccount: "Nu ai cont?",
      signUpLink: "Înregistrează-te",
      errors: {
        invalidEmail: "Email invalid",
        wrongPassword: "Parola trebuie să aibă cel puțin 6 caractere",
        invalidCredentials: "Email sau parolă incorectă",
        networkError: "Eroare de rețea. Te rugăm să încerci din nou.",
      },
    },
    register: {
      title: "Creează cont",
      description: "Completează formularul pentru a-ți crea un cont nou",
      submitButton: "Creează cont",
      roleLabel: "Rol",
      gradeLabel: "Clasă",
      teachingFieldLabel: "Domeniul de predare",
      hasAccount: "Ai deja cont?",
      signInLink: "Conectează-te",
      emailVerification: "Un email de verificare a fost trimis. Te rugăm să verifici inbox-ul.",
      passwordMatch: "Parolele se potrivesc",
      passwordRequirements: {
        title: "Parola trebuie să conțină:",
        minLength: "Cel puțin 8 caractere",
        uppercase: "O literă mare",
        lowercase: "O literă mică",
        number: "O cifră",
        special: "Un caracter special",
      },
      errors: {
        passwordsDontMatch: "Parolele nu se potrivesc",
        gradeRequired: "Clasa este obligatorie pentru elevi",
        teachingFieldRequired: "Domeniul de predare este obligatoriu pentru profesori",
        emailExists: "Acest email este deja înregistrat",
      },
    },
    roleSelection: {
      title: "Selectează rolul tău",
      description: "Te rugăm să alegi rolul pentru a continua. Acest lucru ne ajută să personalizăm experiența ta.",
      student: {
        label: "Elev",
        description: "Sunt elev și vreau să particip la evenimente",
      },
      teacher: {
        label: "Profesor",
        description: "Sunt profesor și organizez evenimente",
      },
      individual: {
        label: "Individual",
        description: "Sunt participant individual",
      },
      continueButton: "Continuă",
      gradeRequired: "Te rugăm să selectezi clasa",
      teachingFieldRequired: "Te rugăm să selectezi domeniul de predare",
    },
  },

  teacherDashboard: {
    createNewLesson: {
      title: "Creează lecție nouă",
      description: "Generează rezumat, slide-uri și ghiduri de predare cu verificare de fapte integrată.",
      button: "Lecție nouă",
    },
    recentLessons: {
      title: "Lecții recente",
      empty: "Nu există lecții încă. Creează prima ta lecție pentru a începe.",
    },
    insights: {
      title: "Perspective",
      hoursSaved: "Ore economisite",
      lessonsGenerated: "Lecții generate",
      mostFrequentSubject: "Materie frecventă",
    },
    tips: {
      title: "Sfaturi pentru lecții mai bune",
      tip1: "Specifică clar nivelul clasei în prompt",
      tip2: "Adaugă 1–3 obiective de învățare pentru rezultate mai bune",
      tip3: "Include stilul de predare preferat sau formatul",
      tip4: "Menționează orice subiecte specifice de evidențiat sau de evitat",
    },
    deleteLesson: {
      title: "Șterge lecția?",
      description: (title: string) => `Ești sigur că vrei să ștergi "${title}"? Această acțiune nu poate fi anulată.`,
      deleting: "Se șterge...",
    },
    completed: "finalizate",
  },

  teacher: {
    studentsView: {
      title: "Vizualizare elevi",
      description: "Vezi toți elevii înscriși la clasele tale, organizați pe niveluri de clasă.",
      emptyTitle: "Niciun elev înscris",
      emptyDescription: "Nu ai încă elevi înscriși. Distribuie codul tău de profesor elevilor pentru ca aceștia să se alăture clasei tale.",
      teacherCodeLabel: "Codul tău de profesor:",
      student: "elev",
      students: "elevi",
    },
    myLessons: {
      title: "Materiile mele",
      description: "Vezi și gestionează lecțiile tale, organizate pe materii.",
      newLesson: "Lecție nouă",
      emptyTitle: "Nicio lecție încă",
      emptyDescription: "Nu ai creat încă nicio lecție. Creează prima ta lecție pentru a începe cu EduAgent.",
      createFirst: "Creează prima ta lecție",
      lesson: "lecție",
      lessons: "lecții",
      open: "Deschide",
      unknownDate: "Dată necunoscută",
      unknownTitle: "Lecție fără titlu",
      subjectsTitle: "Materiile mele",
      subjectsDescription: "Selectează una sau mai multe materii pentru a vedea lecțiile",
      showSelectedLessons: "Afișează lecțiile selectate",
      showAllLessons: "Afișează toate lecțiile",
      noLessonsInSubject: "Nu există lecții pentru această materie",
      selectSubjects: "Selectează materii",
      selectedCount: (count: number) => `${count} ${count === 1 ? "materie selectată" : "materii selectate"}`,
      searchPlaceholder: "Caută după materie sau titlu lecție...",
      noResults: "Nu s-au găsit materii",
    },
    newLesson: {
      steps: {
        defineLesson: "Definește lecția",
        sources: "Surse",
        generation: "Generare",
        factCheck: "Verificare fapte",
        reviewFinish: "Revizuire și finalizare",
        questions: "Întrebări clarificatoare",
      },
      back: "Înapoi",
      next: "Următorul",
      generateQuestions: "Generează întrebări",
      generateLesson: "Generează lecția",
      loadingQuestions: {
        title: "Analizăm lecția ta",
        subtitle: "AI-ul nostru pregătește întrebări clarificatoare",
        steps: {
          analyze: "Analizăm parametrii lecției",
          context: "Înțelegem contextul educațional",
          questions: "Generăm întrebări clarificatoare",
        },
      },
      loadingGeneration: {
        title: "Pregătim generarea de conținut",
        subtitle: "Ne pregătim să creăm lecția ta",
        steps: {
          prepare: "Pregătim modelele AI",
          process: "Procesăm răspunsurile tale",
        },
      },
      step1: {
        titleLabel: "Titlul lecției",
        titlePlaceholder: "ex: Fotosinteză – Clasa a 5-a",
        titleRequired: "Titlul lecției este obligatoriu",
        gradeLabel: "Clasă/Nivel",
        gradePlaceholder: "Selectează clasa",
        gradeRequired: "Clasa este obligatorie",
        subjectLabel: "Materie",
        subjectPlaceholder: "Selectează materia",
        subjectRequired: "Materia este obligatorie",
        numberOfSlidesLabel: "Număr de slide-uri",
        numberOfSlidesPlaceholder: "Selectează numărul de slide-uri",
        slides: "slide-uri",
        templateLabel: "Șablon prezentare",
        templatePlaceholder: "Selectează un șablon",
        previewTemplate: "Previzualizare",
        exampleTitle: "Exemplu de configurare bună a lecției",
        exampleTitleLabel: "Titlu",
        exampleTitleText: "\"Introducere în Fotosinteză – Clasa a 5-a\"",
      },
      step2: {
        title: "Materiale de referință",
        description: "Încarcă fișiere sau introdu promptul",
        dragDrop: "Trage și plasează fișiere PDF sau DOCX aici",
        or: "sau",
        browseFiles: "Răsfoiește fișiere",
        promptLabel: "Introdu promptul",
        promptPlaceholder: "Introdu promptul tău aici...",
        aboutTitle: "Despre surse",
        aboutDescription: "EduAgent folosește aceste surse pentru a genera și verifica conținutul. Cu cât mai multe surse relevante furnizezi, cu atât lecția ta va fi mai precisă și aliniată.",
        promptTipsTitle: "Sfaturi pentru un prompt bun",
        promptTipsDescription: "Un prompt bun este clar și specific. Include detalii despre subiect, nivelul clasei, și ce vrei să acoperi lecția. Acest conținut va fi modificat ulterior.",
        questionsTitle: "Întrebări clarificatoare",
        questionsDescription: "Te rugăm să răspunzi la aceste întrebări pentru a ne ajuta să generăm cel mai bun conținut de lecție pentru elevii tăi.",
        loadingQuestions: "Generăm întrebările...",
        customAnswerPlaceholder: "Introdu răspunsul tău...",
        allQuestionsAnswered: "Toate întrebările au fost răspunse! Poți continua la pasul următor.",
      },
      step3: {
        title: "Generăm lecția ta…",
        description: "Acest proces poate dura câteva momente. Te rugăm să nu închizi această pagină.",
        continueButton: "Continuă la revizuire",
        completedMessage: "Generare finalizată! Poți revizui și ajusta tot conținutul înainte de a-l distribui elevilor.",
        steps: {
          analyzing: "Ne gândim la nevoile elevilor",
          lecture: "Creăm conținutul lecției",
          presentation: "Proiectăm slide-urile prezentării",
          finalizing: "Finalizăm lecția ta",
        },
        descriptions: {
          analyzing: "Analizăm obiectivele educaționale și contextul elevilor...",
          lecture: "Generăm conținut captivant pentru elevi și ghiduri complete pentru profesor...",
          presentation: "Creăm slide-uri frumoase cu șablonul tău selectat...",
          finalizing: "Încărcăm fișierele și pregătim lecția pentru revizuire...",
        },
      },
      step4: {
        title: "Rezumat verificare fapte",
        description: "Revizuiește prezentarea generală a calității înainte de a intra în editorul detaliat",
        back: "Înapoi",
        regenerate: "Regenerează cu surse diferite",
        continue: "Continuă la revizuire",
      },
      step5: {
        title: "Ciorna lecției tale este gata",
        description: "Încă poți edita conținutul și rula detalii de verificare a faptelor pe ecranul următor.",
        button: "Deschide în editor",
      },
    },
    factCheck: {
      title: "Verificare fapte și revizuire calitate",
      description: "Revizuiește afirmațiile marcate înainte de a publica această lecție.",
      flaggedClaims: "Afirmații marcate",
      noIssues: "Nu s-au găsit probleme marcate pentru această lecție.",
      allReviewed: "Toate afirmațiile au fost revizuite!",
      noMatches: "Nicio afirmație nu se potrivește filtrului selectat.",
      status: {
        highConfidence: "Încredere ridicată",
        needsReview: "Necesită revizuire",
        criticalIssues: "Probleme critice găsite",
      },
    },
    lessonEditor: {
      placeholder: "Titlul lecției...",
      runFactCheck: "Rulează verificarea faptelor din nou",
      markAsReady: "Marchează ca gata",
      tabs: {
        studentSummary: "Rezumat elev",
        slides: "Slide-uri",
        teacherGuidelines: "Ghiduri profesor",
        podcast: "Podcast",
      },
      downloadSlides: "Descarcă slide-urile",
      podcast: {
        title: "Podcast educațional",
        duration: "Durată",
        download: "Descarcă",
        notSupported: "Browserul tău nu suportă elementul audio.",
        description: "Ascultă un dialog educațional despre această lecție. Podcastul prezintă o conversație între un profesor și un elev, făcând subiectele complexe mai ușor de înțeles.",
        notAvailable: "Podcast-ul nu este disponibil pentru această lecție.",
      },
      deleteTitle: "Șterge lecția?",
      deleteDescription: (title: string) => `Această acțiune nu poate fi anulată. Aceasta va șterge permanent lecția "${title}".`,
      saving: "Se salvează...",
      saveDraft: "Salvează ciorna",
      markReadyForStudents: "Marchează ca gata pentru elevi",
    },
    lessonViewer: {
      slideCounter: (current: number, total: number) => `Slide ${current} din ${total}`,
      noSlides: "Nu sunt slide-uri disponibile",
      previous: "Anterior",
      next: "Următorul",
      slideInfo: {
        title: "Informații slide",
        notes: "Notițe",
        tips: "Sfaturi",
        resources: "Resurse",
      },
    },
  },

  individual: {
    dashboard: {
      title: "Panou",
      welcome: (name: string) => `Bine ai venit, ${name || "Utilizator"}!`,
      accountTitle: "Cont individual",
      accountDescription: "Panoul tău personalizat de învățare",
      comingSoon: "Conținut în curând.",
    },
  },

  student: {
    dashboard: {
      title: "Panou Student",
      welcomeMessage: (name: string) => `Bine ai revenit, ${name || "Student"}!`,
    joinLesson: {
      title: "Înscrie-te la profesor",
      description: "Introdu codul profesorului pentru a te înscrie la clasa lui.",
      button: "Înscrie-te la profesor",
      ariaLabel: "Înscrie-te la un profesor cu codul de înscriere",
    },
      myInfo: {
        title: "Informațiile mele",
      },
      myTeachers: {
        title: "Profesorii mei",
        description: "Profesorii la care ești înscris",
        emptyState: "Nu ești înscris la niciun profesor încă.",
      },
      myLessons: {
        title: "Lecțiile mele",
        description: "Accesează lecțiile tale și materialele de învățare",
        emptyState: "Încă nu ai lecții atribuite. Profesorul tău va partaja lecții cu tine în curând.",
        openButton: "Deschide",
        openAriaLabel: (title: string) => `Deschide ${title}`,
        lessonAriaLabel: (title: string) => `Deschide lecția: ${title}`,
        completed: "Finalizată",
      },
    },

    joinLesson: {
      title: "Înscrie-te la profesor",
      description: "Introdu codul profesorului pentru a te înscrie la clasa lui.",
      classCodeLabel: "Cod profesor",
      classCodePlaceholder: "ABC123",
      button: "Înscrie-te la profesor",
      buttonLoading: "Te înscriem...",
      helperText: "Cere profesorului tău codul de înscriere format din 6 caractere.",
      errors: {
        emptyCode: "Te rugăm să introduci un cod profesor",
        codeNotFound: "Acest cod profesor nu a putut fi găsit. Verifică cu profesorul tău.",
        invalidCode: "Format cod invalid. Codul trebuie să fie format din 6 caractere alfanumerice.",
        genericError: "Ceva nu a mers bine. Te rugăm să încerci din nou.",
      },
    },

    lessons: {
      title: "Lecțiile mele",
      description: "Accesează toate lecțiile tale și materialele de învățare",
      allLessons: "Toate lecțiile",
      clickToStart: "Click pe orice lecție pentru a începe să înveți",
      emptyState: "Încă nu ai lecții atribuite. Profesorul tău va partaja lecții cu tine în curând.",
      openButton: "Deschide",
      openAriaLabel: (title: string) => `Deschide ${title}`,
      lessonAriaLabel: (title: string) => `Deschide lecția: ${title}`,
      completed: "Finalizată",
      searchPlaceholder: "Caută după materie sau titlu lecție...",
      noResults: "Nu s-au găsit materii",
      lesson: "lecție",
      lessons: "lecții",
      subjectSelected: "materie selectată",
      subjectsSelected: "materii selectate",
      showSelectedLessons: "Afișează lecțiile selectate",
      showAllLessons: "Afișează toate lecțiile",
    },

    lessonPlayer: {
      backToLessons: "Înapoi la lecții",
      tabs: {
        summary: "Rezumat",
        slides: "Slide-uri",
        quiz: "Test",
        podcast: "Podcast",
      },
      downloadSlides: "Descarcă slide-urile",
      podcast: {
        title: "Podcast educațional",
        duration: "Durată",
        download: "Descarcă",
        notSupported: "Browserul tău nu suportă elementul audio.",
        description: "Ascultă un dialog educațional despre această lecție. Podcastul prezintă o conversație între un profesor și un elev, făcând subiectele complexe mai ușor de înțeles.",
        notAvailable: "Podcast-ul nu este disponibil pentru această lecție.",
      },
      summary: {
        learningObjectives: "La sfârșitul acestei lecții vei putea…",
        fontControls: {
          decrease: "Micșorează dimensiunea fontului",
          increase: "Mărește dimensiunea fontului",
          listen: "Ascultă",
          stop: "Oprește",
          listenTooltip: "Ascultă conținutul lecției",
          ttsNotSupported: "Citirea cu voce tare nu este suportată în browserul dvs.",
          noContent: "Nu există conținut disponibil pentru citire.",
          ttsError: "A apărut o eroare la citirea textului.",
        },
      },
      slides: {
        counter: (current: number, total: number) => `Slide ${current} din ${total}`,
        previous: "Anterior",
        next: "Următor",
        textVersion: "Conținut slide (versiune text)",
        goToSlide: (index: number) => `Mergi la slide-ul ${index + 1}`,
        emptyState: "Nu sunt slide-uri disponibile pentru această lecție.",
      },
      quiz: {
        questionLabel: (index: number, question: string) => `Întrebarea ${index + 1}: ${question}`,
        answeredCount: (answered: number, total: number) => `${answered} din ${total} întrebări răspunse`,
        submitButton: "Trimite testul",
        submitButtonLoading: "Se trimite...",
        submitWarning: "Te rugăm să răspunzi la toate întrebările înainte de a trimite.",
        success: {
          title: "Test trimis cu succes!",
          score: (correct: number, total: number, percentage: number) =>
            `Scorul tău: ${correct} / ${total} (${percentage}%)`,
          message: "Testul tău a fost trimis și așteaptă feedback-ul profesorului.",
          feedbackMessage: "Profesorul tău va revizui răspunsurile tale și va oferi feedback în curând.",
        },
        errors: {
          notAllAnswered: "Te rugăm să răspunzi la toate întrebările înainte de a trimite.",
          submitFailed: "Trimiterea testului a eșuat. Te rugăm să încerci din nou.",
        },
        emptyState: "Nu este disponibil niciun test pentru această lecție.",
      },
      keyTerms: {
        title: "Termeni cheie",
        footer: "Această lecție a fost creată cu EduAgent și revizuită de profesorul tău.",
      },
      teacherInfo: {
        title: "Informații profesor",
        teacherName: "Profesor",
        teachingField: "Materie",
        grade: "Clasă",
      },
    },

    chatbot: {
      title: "Asistent de Învățare",
      subtitle: "Întreabă-mă orice despre lecție",
      welcomeMessage: "Bună! Sunt aici să te ajut să înțelegi această lecție. Simte-te liber să-mi pui orice întrebări! 😊",
      inputPlaceholder: "Scrie întrebarea ta...",
      errorMessage: "Ne pare rău, am întâmpinat o eroare. Te rog încearcă din nou.",
    },
  },

  placeholders: {
    student: "Student",
    lessonTitle: "Titlul lecției",
    subject: "Materia",
    grade: "Clasa",
    teacherName: "Numele profesorului",
    className: "Clasa",
  },

  subjects: {
    science: "Științe",
    history: "Istorie",
    math: "Matematică",
    language: "Limba română",
    art: "Arte",
    music: "Muzică",
    physicalEducation: "Educație fizică",
  },

  grades: {
    "Grade 1": "Clasa I",
    "Grade 2": "Clasa a II-a",
    "Grade 3": "Clasa a III-a",
    "Grade 4": "Clasa a IV-a",
    "Grade 5": "Clasa a V-a",
    "Grade 6": "Clasa a VI-a",
    "Grade 7": "Clasa a VII-a",
    "Grade 8": "Clasa a VIII-a",
    "Grade 9": "Clasa a IX-a",
    "Grade 10": "Clasa a X-a",
    "Grade 11": "Clasa a XI-a",
    "Grade 12": "Clasa a XII-a",
    "University": "Universitate",
    "Adult": "Adult",
  },

  teachingFields: {
    "Communication in Romanian": "Comunicare în limba română",
    "Romanian Language and Literature": "Limba și literatura română",
    "Mathematics": "Matematică",
    "Mathematics and Environment Exploration": "Matematică și explorarea mediului",
    "Computer Science": "Informatică",
    "Computer Science and ICT": "Informatică și TIC",
    "Physics": "Fizică",
    "Chemistry": "Chimie",
    "Biology": "Biologie",
    "Geography": "Geografie",
    "History": "Istorie",
    "History of Communism in Romania": "Istoria comunismului în România",
    "Sciences": "Științe",
    "Natural Sciences": "Științe naturale",
  },

  templates: {
    template_modern: "Modern",
    template_classic: "Clasic",
    template_minimal: "Minimalist",
    template_colorful: "Colorat",
    template_professional: "Profesional",
    template_creative: "Creativ",
    template_educational: "Educațional",
    template_business: "Business",
    template_science: "Științific",
    template_artistic: "Artistic",
  },

  mockLessons: {
    lesson1: {
      title: "Fotosinteză – Clasa a 5-a",
      subject: "Științe",
      grade: "Clasa a 5-a",
      teacherName: "D-na Ionescu",
      learningObjectives: [
        "Să înțelegi cum plantele produc hrană",
        "Să identifici componentele cheie ale fotosintezei",
        "Să explici rolul luminii solare în acest proces",
      ],
      studentSummary: `# Introducere în Fotosinteză

Fotosinteza este procesul prin care plantele folosesc lumina soarelui, apa și dioxidul de carbon pentru a-și crea propria hrană. Acest proces uimitor are loc în frunzele plantelor, mai exact în structuri numite cloroplaste.

## Cum Funcționează

În timpul fotosintezei, plantele absorb lumina soarelui prin frunzele lor. Pigmentul verde numit clorofilă captează energia luminii. Plantele absorb de asemenea apă prin rădăcini și dioxid de carbon din aer prin deschizături mici din frunze numite stomate.

## Procesul

Folosind aceste ingrediente și energia de la lumina soarelui, plantele produc glucoză (un tip de zahăr) pe care o folosesc ca hrană. Ca produs secundar, plantele eliberează oxigen în aer, care este esențial pentru ca toate ființele vii să respire.

## Componente Cheie

- **Clorofilă**: Pigmentul verde care captează lumina soarelui
- **Stomate**: Deschizături mici în frunze care permit schimbul de gaze
- **Rădăcini**: Absorb apa din sol
- **Frunze**: Unde are loc cea mai mare parte a fotosintezei`,
      slides: [
        {
          id: "slide_1",
          title: "Ce este fotosinteza?",
          content: "- Procesul prin care plantele produc hrană\n- Folosește lumina soarelui, apa și CO2\n- Are loc în frunze",
        },
        {
          id: "slide_2",
          title: "Procesul",
          content: "- Plantele absorb lumina soarelui\n- Absorb apă și dioxid de carbon\n- Transformă în glucoză și oxigen",
        },
        {
          id: "slide_3",
          title: "Componente Cheie",
          content: "- Clorofila captează lumina\n- Stomatele permit schimbul de gaze\n- Rădăcinile absorb apa",
        },
        {
          id: "slide_4",
          title: "De Ce Este Importantă",
          content: "- Plantele produc oxigenul pe care îl respirăm\n- Creează hrană pentru plantă\n- Fundația majorității lanțurilor trofice",
        },
      ],
      quiz: [
        {
          id: "q1",
          question: "Care este scopul principal al fotosintezei?",
          options: [
            "Să facă plantele verzi",
            "Să creeze hrană pentru plantă folosind lumina soarelui",
            "Să absoarbă apă din sol",
            "Să producă dioxid de carbon",
          ],
          correctAnswer: 1,
          explanation: "Fotosinteza este procesul prin care plantele își creează propria hrană (glucoză) folosind lumina soarelui, apa și dioxidul de carbon.",
        },
        {
          id: "q2",
          question: "Ce pigment captează lumina soarelui în plante?",
          options: ["Stomate", "Clorofilă", "Glucoză", "Oxigen"],
          correctAnswer: 1,
          explanation: "Clorofila este pigmentul verde din frunzele plantelor care captează energia luminii de la soare.",
        },
      ],
      keyTerms: [
        { term: "Fotosinteză", definition: "Procesul prin care plantele produc hrană folosind lumina soarelui, apa și dioxidul de carbon." },
        { term: "Clorofilă", definition: "Pigmentul verde din plante care captează energia luminii." },
        { term: "Stomate", definition: "Deschizături mici în frunze care permit plantelor să schimbe gaze." },
        { term: "Glucoză", definition: "Un tip de zahăr pe care plantele îl produc în timpul fotosintezei." },
      ],
    },
    lesson2: {
      title: "Civilizații Antice",
      subject: "Istorie",
      grade: "Clasa a 6-a",
      teacherName: "Dl. Smith",
    },
  },
};

// English translations (for future use)
const en: Translations = {
  common: {
    appName: "EduAgent",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    search: "Search",
    filter: "Filter",
    noResults: "No results found",
    welcome: "Welcome",
    welcomeBack: (name: string) => `Welcome back, ${name}!`,
    retry: "Retry",
    messages: {
      loading: "Loading...",
      error: "An error occurred",
      success: "Success",
      noData: "No data",
      notFound: "Not found",
      today: "Today",
      yesterday: "Yesterday",
    },
    status: {
      draft: "Draft",
      factcheckneeded: "Fact-check needed",
      factcheckpending: "Fact-check pending",
      ready: "Ready",
      sentToStudents: "Sent to students",
    },
    labels: {
      status: "Status",
      name: "Name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      role: "Role",
      grade: "Grade",
      teacherCode: "Teacher Code",
      enrolledStudents: "Enrolled Students",
    },
    buttons: {
      open: "Open",
      copy: "Copy",
      copied: "Copied!",
    },
    profile: {
      title: "Profile",
      profileInformation: "Profile Information",
      accountDetails: "Account Details",
      accountCreated: "Account Created",
      authenticationMethod: "Authentication Method",
      shareCodeMessage: "Share this code with students to enroll them in your class",
      studentsEnrolled: "students enrolled",
      userId: "User ID",
      additionalInfo: "Additional information",
      saveChanges: "Save Changes",
      editProfile: "Edit Profile",
      loadingProfile: "Loading profile...",
      noProfileData: "No profile data found.",
      notAuthenticated: "Not authenticated",
      roleSelectionHint: "If you just signed in with Google, make sure you selected a role.",
      tryAgain: "Try Again",
      refreshPage: "Refresh Page",
      roles: {
        student: "Student",
        teacher: "Teacher",
        individual: "Individual",
      },
    },
  },

  navbar: {
    student: {
      dashboard: "Dashboard",
      myLessons: "My Lessons",
      account: "Account",
    },
    teacher: {
      dashboard: "Dashboard",
      myLessons: "My Subjects",
      account: "Account",
    },
    profile: "Profile",
    logout: "Logout",
    menu: "Menu",
    toggleMenu: "Toggle menu",
  },

  auth: {
    login: {
      title: "Sign In",
      description: "Enter your email and password to sign in",
      submitButton: "Sign In",
      orContinueWith: "or continue with",
      noAccount: "Don't have an account?",
      signUpLink: "Sign up",
      errors: {
        invalidEmail: "Invalid email",
        wrongPassword: "Password must be at least 6 characters",
        invalidCredentials: "Invalid email or password",
        networkError: "Network error. Please try again.",
      },
    },
    register: {
      title: "Create Account",
      description: "Fill out the form to create a new account",
      submitButton: "Create Account",
      roleLabel: "Role",
      gradeLabel: "Grade",
      teachingFieldLabel: "Teaching Field",
      hasAccount: "Already have an account?",
      signInLink: "Sign in",
      emailVerification: "A verification email has been sent. Please check your inbox.",
      passwordMatch: "Passwords match",
      passwordRequirements: {
        title: "Password must contain:",
        minLength: "At least 8 characters",
        uppercase: "One uppercase letter",
        lowercase: "One lowercase letter",
        number: "One number",
        special: "One special character",
      },
      errors: {
        passwordsDontMatch: "Passwords don't match",
        gradeRequired: "Grade is required for students",
        teachingFieldRequired: "Teaching field is required for teachers",
        emailExists: "This email is already registered",
      },
    },
    roleSelection: {
      title: "Select Your Role",
      description: "Please choose your role to continue. This helps us personalize your experience.",
      student: {
        label: "Student",
        description: "I'm a student looking to join events",
      },
      teacher: {
        label: "Teacher",
        description: "I'm a teacher organizing events",
      },
      individual: {
        label: "Individual",
        description: "I'm an individual participant",
      },
      continueButton: "Continue",
      gradeRequired: "Please select your grade",
      teachingFieldRequired: "Please select your teaching field",
    },
  },

  teacherDashboard: {
    createNewLesson: {
      title: "Create New Lesson",
      description: "Generate summary, slides, and teaching guides with integrated fact-checking.",
      button: "New Lesson",
    },
    recentLessons: {
      title: "Recent Lessons",
      empty: "No lessons yet. Create your first lesson to get started.",
    },
    insights: {
      title: "Insights",
      hoursSaved: "Hours Saved",
      lessonsGenerated: "Lessons Generated",
      mostFrequentSubject: "Most Frequent Subject",
    },
    tips: {
      title: "Tips for Better Lessons",
      tip1: "Clearly specify the grade level in the prompt",
      tip2: "Add 1–3 learning objectives for better results",
      tip3: "Include your preferred teaching style or format",
      tip4: "Mention any specific topics to highlight or avoid",
    },
    deleteLesson: {
      title: "Delete Lesson?",
      description: (title: string) => `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      deleting: "Deleting...",
    },
    completed: "completed",
  },

  teacher: {
    studentsView: {
      title: "Students View",
      description: "View all students enrolled to your classes, organized by grade level.",
      emptyTitle: "No students enrolled",
      emptyDescription: "You don't have any students enrolled yet. Share your teacher code with students so they can join your class.",
      teacherCodeLabel: "Your teacher code:",
      student: "student",
      students: "students",
    },
    myLessons: {
      title: "My Subjects",
      description: "View and manage your lessons, organized by subject.",
      newLesson: "New Lesson",
      emptyTitle: "No lessons yet",
      emptyDescription: "You haven't created any lessons yet. Create your first lesson to get started with EduAgent.",
      createFirst: "Create Your First Lesson",
      lesson: "lesson",
      lessons: "lessons",
      open: "Open",
      unknownDate: "Unknown date",
      unknownTitle: "Untitled Lesson",
      subjectsTitle: "My Subjects",
      subjectsDescription: "Select one or more subjects to view lessons",
      showSelectedLessons: "Show Selected Lessons",
      showAllLessons: "Show All Lessons",
      noLessonsInSubject: "No lessons for this subject",
      selectSubjects: "Select Subjects",
      selectedCount: (count: number) => `${count} ${count === 1 ? "subject selected" : "subjects selected"}`,
      searchPlaceholder: "Search by subject or lesson title...",
      noResults: "No subjects found",
    },
    newLesson: {
      steps: {
        defineLesson: "Define lesson",
        sources: "Sources",
        generation: "Generation",
        factCheck: "Fact-check",
        reviewFinish: "Review & finish",
        questions: "Clarifying questions",
      },
      back: "Back",
      next: "Next",
      generateQuestions: "Generate Questions",
      generateLesson: "Generate Lesson",
      loadingQuestions: {
        title: "Analyzing Your Lesson",
        subtitle: "Our AI is preparing clarifying questions",
        steps: {
          analyze: "Analyzing lesson parameters",
          context: "Understanding educational context",
          questions: "Generating clarifying questions",
        },
      },
      loadingGeneration: {
        title: "Preparing Content Generation",
        subtitle: "Getting ready to create your lesson",
        steps: {
          prepare: "Preparing AI models",
          process: "Processing your answers",
        },
      },
      step1: {
        titleLabel: "Lesson title",
        titlePlaceholder: "e.g., Photosynthesis – Grade 5",
        titleRequired: "Lesson title is required",
        gradeLabel: "Grade/Level",
        gradePlaceholder: "Select grade",
        gradeRequired: "Grade is required",
        subjectLabel: "Subject",
        subjectPlaceholder: "Select subject",
        subjectRequired: "Subject is required",
        numberOfSlidesLabel: "Number of slides",
        numberOfSlidesPlaceholder: "Select number of slides",
        slides: "slides",
        templateLabel: "Presentation Template",
        templatePlaceholder: "Select a template",
        previewTemplate: "Preview",
        exampleTitle: "Example of a good lesson setup",
        exampleTitleLabel: "Title",
        exampleTitleText: "\"Introduction to Photosynthesis – Grade 5\"",
      },
      step2: {
        title: "Reference materials",
        description: "Upload files or enter your prompt",
        dragDrop: "Drag and drop PDF or DOCX files here",
        or: "or",
        browseFiles: "Browse files",
        promptLabel: "Enter your prompt",
        promptPlaceholder: "Enter your prompt here...",
        aboutTitle: "About sources",
        aboutDescription: "EduAgent uses these sources to generate and fact-check content. The more relevant sources you provide, the more accurate and aligned your lesson will be.",
        promptTipsTitle: "Tips for a good prompt",
        promptTipsDescription: "A good prompt is clear and specific. Include details about the subject, grade level, and what you want the lesson to cover. This content will be modified later.",
        questionsTitle: "Clarifying Questions",
        questionsDescription: "Please answer these questions to help us generate the best lesson content for your students.",
        loadingQuestions: "Generating questions...",
        customAnswerPlaceholder: "Enter your answer...",
        allQuestionsAnswered: "All questions answered! You can proceed to the next step.",
      },
      step3: {
        title: "Generating your lesson…",
        description: "This may take a few moments. Please don't close this page.",
        continueButton: "Continue to review",
        completedMessage: "Generation complete! You can review and adjust all content before sharing with students.",
        steps: {
          analyzing: "Thinking about student needs",
          lecture: "Crafting lesson content",
          presentation: "Designing presentation slides",
          finalizing: "Finalizing your lesson",
        },
        descriptions: {
          analyzing: "Analyzing educational objectives and student context...",
          lecture: "Generating engaging content for students and comprehensive teacher guidelines...",
          presentation: "Creating beautiful slides with your selected template...",
          finalizing: "Uploading files and preparing your lesson for review...",
        },
      },
      step4: {
        title: "Fact-checking summary",
        description: "Review the quality overview before entering the detailed editor",
        back: "Back",
        regenerate: "Regenerate with different sources",
        continue: "Continue to review",
      },
      step5: {
        title: "Your lesson draft is ready",
        description: "You can still edit content and run fact-check details on the next screen.",
        button: "Open in editor",
      },
    },
    factCheck: {
      title: "Fact-checking & quality review",
      description: "Review flagged claims before publishing this lesson.",
      flaggedClaims: "Flagged claims",
      noIssues: "No flagged issues found for this lesson.",
      allReviewed: "All claims have been reviewed!",
      noMatches: "No claims match the selected filter.",
      status: {
        highConfidence: "High confidence",
        needsReview: "Needs review",
        criticalIssues: "Critical issues found",
      },
    },
    lessonEditor: {
      placeholder: "Lesson title...",
      runFactCheck: "Run fact-check again",
      markAsReady: "Mark as ready",
      tabs: {
        studentSummary: "Student summary",
        slides: "Slides",
        teacherGuidelines: "Teacher guidelines",
        podcast: "Podcast",
      },
      downloadSlides: "Download Slides",
      podcast: {
        title: "Educational Podcast",
        duration: "Duration",
        download: "Download",
        notSupported: "Your browser does not support the audio element.",
        description: "Listen to an educational dialogue about this lesson. The podcast features a conversation between a teacher and student, making complex topics easier to understand.",
        notAvailable: "Podcast not available for this lesson.",
      },
      deleteTitle: "Delete lesson?",
      deleteDescription: (title: string) => `This action cannot be undone. This will permanently delete the lesson "${title}".`,
      saving: "Saving...",
      saveDraft: "Save draft",
      markReadyForStudents: "Mark as ready for students",
    },
    lessonViewer: {
      slideCounter: (current: number, total: number) => `Slide ${current} of ${total}`,
      noSlides: "No slides available",
      previous: "Previous",
      next: "Next",
      slideInfo: {
        title: "Slide Information",
        notes: "Notes",
        tips: "Tips",
        resources: "Resources",
      },
    },
  },

  individual: {
    dashboard: {
      title: "Dashboard",
      welcome: (name: string) => `Welcome, ${name || "User"}!`,
      accountTitle: "Individual Account",
      accountDescription: "Your personalized learning dashboard",
      comingSoon: "Content coming soon.",
    },
  },

  student: {
      dashboard: {
      title: "Student Dashboard",
      welcomeMessage: (name: string) => `Welcome back, ${name || "Student"}!`,
      joinLesson: {
        title: "Join a lesson",
        description: "Enter a class code to join your teacher's lesson.",
        button: "Join lesson",
        ariaLabel: "Join a lesson with class code",
      },
      myInfo: {
        title: "My Information",
      },
      myTeachers: {
        title: "My Teachers",
        description: "Teachers you are enrolled with",
        emptyState: "You are not enrolled with any teachers yet.",
      },
      myLessons: {
        title: "My Lessons",
        description: "Access your assigned lessons and learning materials",
        emptyState: "No lessons assigned yet. Your teacher will share lessons with you soon.",
        openButton: "Open",
        openAriaLabel: (title: string) => `Open ${title}`,
        lessonAriaLabel: (title: string) => `Open lesson: ${title}`,
        completed: "Completed",
      },
    },

    joinLesson: {
      title: "Enroll with Teacher",
      description: "Enter your teacher's code to join their class.",
      classCodeLabel: "Teacher Code",
      classCodePlaceholder: "ABC123",
      button: "Enroll with Teacher",
      buttonLoading: "Enrolling...",
      helperText: "Ask your teacher for their 6-character enrollment code.",
      errors: {
        emptyCode: "Please enter a teacher code",
        codeNotFound: "This teacher code could not be found. Check with your teacher.",
        invalidCode: "Invalid code format. Code must be 6 alphanumeric characters.",
        genericError: "Something went wrong. Please try again.",
      },
    },

    lessons: {
      title: "My Lessons",
      description: "Access all your assigned lessons and learning materials",
      allLessons: "All Lessons",
      clickToStart: "Click on any lesson to start learning",
      emptyState: "No lessons assigned yet. Your teacher will share lessons with you soon.",
      openButton: "Open",
      openAriaLabel: (title: string) => `Open ${title}`,
      lessonAriaLabel: (title: string) => `Open lesson: ${title}`,
      completed: "Completed",
      searchPlaceholder: "Search by subject or lesson title...",
      noResults: "No subjects found",
      lesson: "lesson",
      lessons: "lessons",
      subjectSelected: "subject selected",
      subjectsSelected: "subjects selected",
      showSelectedLessons: "Show Selected Lessons",
      showAllLessons: "Show All Lessons",
    },

    lessonPlayer: {
      backToLessons: "Back to lessons",
      tabs: {
        summary: "Summary",
        slides: "Slides",
        quiz: "Quiz",
        podcast: "Podcast",
      },
      downloadSlides: "Download Slides",
      podcast: {
        title: "Educational Podcast",
        duration: "Duration",
        download: "Download",
        notSupported: "Your browser does not support the audio element.",
        description: "Listen to an educational dialogue about this lesson. The podcast features a conversation between a teacher and student, making complex topics easier to understand.",
        notAvailable: "Podcast not available for this lesson.",
      },
      summary: {
        learningObjectives: "By the end of this lesson you will be able to…",
        fontControls: {
          decrease: "Decrease font size",
          increase: "Increase font size",
          listen: "Listen",
          stop: "Stop",
          listenTooltip: "Listen to the lesson content",
          ttsNotSupported: "Text-to-speech is not supported in your browser.",
          noContent: "No content available to read.",
          ttsError: "An error occurred while reading the text.",
        },
      },
      slides: {
        counter: (current: number, total: number) => `Slide ${current} of ${total}`,
        previous: "Previous",
        next: "Next",
        textVersion: "Slide Content (Text Version)",
        goToSlide: (index: number) => `Go to slide ${index + 1}`,
        emptyState: "No slides available for this lesson.",
      },
      quiz: {
        questionLabel: (index: number, question: string) => `Question ${index + 1}: ${question}`,
        answeredCount: (answered: number, total: number) => `${answered} of ${total} questions answered`,
        submitButton: "Submit Quiz",
        submitButtonLoading: "Submitting...",
        submitWarning: "Please answer all questions before submitting.",
        success: {
          title: "Quiz Submitted Successfully!",
          score: (correct: number, total: number, percentage: number) =>
            `Your Score: ${correct} / ${total} (${percentage}%)`,
          message: "Your quiz has been submitted and is waiting for teacher feedback.",
          feedbackMessage: "Your teacher will review your answers and provide feedback soon.",
        },
        errors: {
          notAllAnswered: "Please answer all questions before submitting.",
          submitFailed: "Failed to submit quiz. Please try again.",
        },
        emptyState: "No quiz available for this lesson.",
      },
      keyTerms: {
        title: "Key Terms",
        footer: "This lesson was created with EduAgent and reviewed by your teacher.",
      },
      teacherInfo: {
        title: "Teacher Information",
        teacherName: "Teacher",
        teachingField: "Subject",
        grade: "Grade",
      },
    },

    chatbot: {
      title: "Learning Assistant",
      subtitle: "Ask me anything about this lesson",
      welcomeMessage: "Hi! I'm here to help you understand this lesson. Feel free to ask me any questions! 😊",
      inputPlaceholder: "Type your question...",
      errorMessage: "Sorry, I encountered an error. Please try again.",
    },
  },

  placeholders: {
    student: "Student",
    lessonTitle: "Lesson Title",
    subject: "Subject",
    grade: "Grade",
    teacherName: "Teacher Name",
    className: "Class",
  },

  subjects: {
    science: "Science",
    history: "History",
    math: "Math",
    language: "Language",
    art: "Art",
    music: "Music",
    physicalEducation: "Physical Education",
  },

  grades: {
    "Grade 1": "Grade 1",
    "Grade 2": "Grade 2",
    "Grade 3": "Grade 3",
    "Grade 4": "Grade 4",
    "Grade 5": "Grade 5",
    "Grade 6": "Grade 6",
    "Grade 7": "Grade 7",
    "Grade 8": "Grade 8",
    "Grade 9": "Grade 9",
    "Grade 10": "Grade 10",
    "Grade 11": "Grade 11",
    "Grade 12": "Grade 12",
    "University": "University",
    "Adult": "Adult",
  },

  teachingFields: {
    "Communication in Romanian": "Communication in Romanian",
    "Romanian Language and Literature": "Romanian Language and Literature",
    "Mathematics": "Mathematics",
    "Mathematics and Environment Exploration": "Mathematics and Environment Exploration",
    "Computer Science": "Computer Science",
    "Computer Science and ICT": "Computer Science and ICT",
    "Physics": "Physics",
    "Chemistry": "Chemistry",
    "Biology": "Biology",
    "Geography": "Geography",
    "History": "History",
    "History of Communism in Romania": "History of Communism in Romania",
    "Sciences": "Sciences",
    "Natural Sciences": "Natural Sciences",
  },

  templates: {
    template_modern: "Modern",
    template_classic: "Classic",
    template_minimal: "Minimal",
    template_colorful: "Colorful",
    template_professional: "Professional",
    template_creative: "Creative",
    template_educational: "Educational",
    template_business: "Business",
    template_science: "Science",
    template_artistic: "Artistic",
  },

  mockLessons: {
    lesson1: {
      title: "Photosynthesis – Grade 5",
      subject: "Science",
      grade: "Grade 5",
      teacherName: "Ms. Ionescu",
      learningObjectives: [
        "Understand how plants make food",
        "Identify the key components of photosynthesis",
        "Explain the role of sunlight in the process",
      ],
      studentSummary: `# Introduction to Photosynthesis

Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create their own food. This amazing process happens in the leaves of plants, specifically in structures called chloroplasts.

## How It Works

During photosynthesis, plants absorb sunlight through their leaves. The green pigment called chlorophyll captures the light energy. Plants also take in water through their roots and carbon dioxide from the air through tiny openings in their leaves called stomata.

## The Process

Using these ingredients and the energy from sunlight, plants produce glucose (a type of sugar) which they use as food. As a byproduct, plants release oxygen into the air, which is essential for all living things to breathe.

## Key Components

- **Chlorophyll**: The green pigment that captures sunlight
- **Stomata**: Tiny openings in leaves that allow gas exchange
- **Roots**: Absorb water from the soil
- **Leaves**: Where most photosynthesis occurs`,
      slides: [
        {
          id: "slide_1",
          title: "What is Photosynthesis?",
          content: "- Process by which plants make food\n- Uses sunlight, water, and CO2\n- Happens in leaves",
        },
        {
          id: "slide_2",
          title: "The Process",
          content: "- Plants absorb sunlight\n- Take in water and carbon dioxide\n- Convert to glucose and oxygen",
        },
        {
          id: "slide_3",
          title: "Key Components",
          content: "- Chlorophyll captures light\n- Stomata allow gas exchange\n- Roots absorb water",
        },
        {
          id: "slide_4",
          title: "Why It Matters",
          content: "- Plants produce oxygen we breathe\n- Creates food for the plant\n- Foundation of most food chains",
        },
      ],
      quiz: [
        {
          id: "q1",
          question: "What is the main purpose of photosynthesis?",
          options: [
            "To make plants green",
            "To create food for the plant using sunlight",
            "To absorb water from the soil",
            "To produce carbon dioxide",
          ],
          correctAnswer: 1,
          explanation: "Photosynthesis is the process by which plants create their own food (glucose) using sunlight, water, and carbon dioxide.",
        },
        {
          id: "q2",
          question: "What pigment captures sunlight in plants?",
          options: ["Stomata", "Chlorophyll", "Glucose", "Oxygen"],
          correctAnswer: 1,
          explanation: "Chlorophyll is the green pigment in plant leaves that captures light energy from the sun.",
        },
      ],
      keyTerms: [
        { term: "Photosynthesis", definition: "The process by which plants make food using sunlight, water, and carbon dioxide." },
        { term: "Chlorophyll", definition: "The green pigment in plants that captures light energy." },
        { term: "Stomata", definition: "Tiny openings in leaves that allow plants to exchange gases." },
        { term: "Glucose", definition: "A type of sugar that plants produce during photosynthesis." },
      ],
    },
    lesson2: {
      title: "Ancient Civilizations",
      subject: "History",
      grade: "Grade 6",
      teacherName: "Mr. Smith",
    },
  },
};

// Translation dictionary
export const translations: Record<Language, Translations> = {
  ro,
  en,
};

// Default language (Romanian)
export const defaultLanguage: Language = "ro";

/**
 * Get translations for a specific language
 * @param lang - Language code (defaults to Romanian)
 * @returns Translations object for the specified language
 */
export function getTranslations(lang: Language = defaultLanguage): Translations {
  return translations[lang] || translations[defaultLanguage];
}

/**
 * Translation hook/utility - can be extended to use React Context for language switching
 * For now, returns Romanian translations by default
 */
export const t = getTranslations(defaultLanguage);

// Export individual language objects for direct access if needed
export { ro as translationsRo, en as translationsEn };

/**
 * Get mock lesson data based on language
 * @param lang - Language code
 * @returns Mock lesson data object
 */
export function getMockLessonData(lang: Language = defaultLanguage) {
  const t = getTranslations(lang);
  
  return {
    id: "lesson_123",
    title: t.mockLessons.lesson1.title,
    subject: t.mockLessons.lesson1.subject,
    grade: t.mockLessons.lesson1.grade,
    teacherName: t.mockLessons.lesson1.teacherName,
    className: "5B",
    learningObjectives: t.mockLessons.lesson1.learningObjectives,
    studentSummary: t.mockLessons.lesson1.studentSummary,
    slides: t.mockLessons.lesson1.slides,
    quiz: t.mockLessons.lesson1.quiz,
    keyTerms: t.mockLessons.lesson1.keyTerms,
  };
}

/**
 * Get mock lessons list based on language
 * @param lang - Language code
 * @returns Array of mock lessons
 */
export function getMockLessonsList(lang: Language = defaultLanguage) {
  const t = getTranslations(lang);
  
  return [
    {
      id: "lesson_123",
      title: t.mockLessons.lesson1.title,
      subject: t.mockLessons.lesson1.subject,
      grade: t.mockLessons.lesson1.grade,
      teacherName: t.mockLessons.lesson1.teacherName,
      dateJoined: "2024-01-15",
    },
    {
      id: "lesson_456",
      title: t.mockLessons.lesson2.title,
      subject: t.mockLessons.lesson2.subject,
      grade: t.mockLessons.lesson2.grade,
      teacherName: t.mockLessons.lesson2.teacherName,
      dateJoined: "2024-01-14",
    },
  ];
}
