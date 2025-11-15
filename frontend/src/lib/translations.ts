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
  };

  // Navbar translations
  navbar: {
    student: {
      dashboard: string;
      myLessons: string;
      account: string;
    };
    profile: string;
    logout: string;
    menu: string;
    toggleMenu: string;
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
      myLessons: {
        title: string;
        description: string;
        emptyState: string;
        openButton: string;
        openAriaLabel: (title: string) => string;
        lessonAriaLabel: (title: string) => string;
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
    };

    // Lesson Player
    lessonPlayer: {
      backToLessons: string;
      tabs: {
        summary: string;
        slides: string;
        quiz: string;
      };
      summary: {
        learningObjectives: string;
        fontControls: {
          decrease: string;
          increase: string;
          listen: string;
          listenTooltip: string;
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
  },

  navbar: {
    student: {
      dashboard: "Panou",
      myLessons: "Lecțiile mele",
      account: "Cont",
    },
    profile: "Profil",
    logout: "Deconectare",
    menu: "Meniu",
    toggleMenu: "Deschide/închide meniul",
  },

  student: {
    dashboard: {
      title: "Panou Student",
      welcomeMessage: (name: string) => `Bine ai revenit, ${name || "Student"}!`,
      joinLesson: {
        title: "Alătură-te unei lecții",
        description: "Introdu codul clasei pentru a te alătura lecției profesorului tău.",
        button: "Alătură-te lecției",
        ariaLabel: "Alătură-te unei lecții cu codul clasei",
      },
      myLessons: {
        title: "Lecțiile mele",
        description: "Accesează lecțiile tale și materialele de învățare",
        emptyState: "Încă nu ai lecții atribuite. Profesorul tău va partaja lecții cu tine în curând.",
        openButton: "Deschide",
        openAriaLabel: (title: string) => `Deschide ${title}`,
        lessonAriaLabel: (title: string) => `Deschide lecția: ${title}`,
      },
    },

    joinLesson: {
      title: "Alătură-te lecției",
      description: "Introdu codul clasei dat de profesorul tău.",
      classCodeLabel: "Cod clasă",
      classCodePlaceholder: "ABC123",
      button: "Alătură-te lecției",
      buttonLoading: "Te alăturăm...",
      helperText: "Sau deschide link-ul direct dacă profesorul tău ți l-a partajat.",
      errors: {
        emptyCode: "Te rugăm să introduci un cod clasă",
        codeNotFound: "Acest cod clasă nu a putut fi găsit. Verifică cu profesorul tău.",
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
    },

    lessonPlayer: {
      backToLessons: "Înapoi la lecții",
      tabs: {
        summary: "Rezumat",
        slides: "Slide-uri",
        quiz: "Test",
      },
      summary: {
        learningObjectives: "La sfârșitul acestei lecții vei putea…",
        fontControls: {
          decrease: "Micșorează dimensiunea fontului",
          increase: "Mărește dimensiunea fontului",
          listen: "Ascultă",
          listenTooltip: "Funcția de citire cu voce tare va fi disponibilă în curând",
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
  },

  navbar: {
    student: {
      dashboard: "Dashboard",
      myLessons: "My Lessons",
      account: "Account",
    },
    profile: "Profile",
    logout: "Logout",
    menu: "Menu",
    toggleMenu: "Toggle menu",
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
      myLessons: {
        title: "My Lessons",
        description: "Access your assigned lessons and learning materials",
        emptyState: "No lessons assigned yet. Your teacher will share lessons with you soon.",
        openButton: "Open",
        openAriaLabel: (title: string) => `Open ${title}`,
        lessonAriaLabel: (title: string) => `Open lesson: ${title}`,
      },
    },

    joinLesson: {
      title: "Join your lesson",
      description: "Enter the class code given by your teacher.",
      classCodeLabel: "Class code",
      classCodePlaceholder: "ABC123",
      button: "Join lesson",
      buttonLoading: "Joining...",
      helperText: "Or open the link directly if your teacher shared one.",
      errors: {
        emptyCode: "Please enter a class code",
        codeNotFound: "This class code couldn't be found. Check with your teacher.",
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
    },

    lessonPlayer: {
      backToLessons: "Back to lessons",
      tabs: {
        summary: "Summary",
        slides: "Slides",
        quiz: "Quiz",
      },
      summary: {
        learningObjectives: "By the end of this lesson you will be able to…",
        fontControls: {
          decrease: "Decrease font size",
          increase: "Increase font size",
          listen: "Listen",
          listenTooltip: "Read aloud feature coming soon",
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
const translations: Record<Language, Translations> = {
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

