/**
 * Translations for EduAgent
 * 
 * This file contains all user-facing text strings in the application.
 * Romanian is the main/default language.
 * 
 * Structure:
 * - Organized by feature/page for easy maintenance
 * - Nested objects for logical grouping
 * - Easy to extend with additional languages in the future
 */

export const translations = {
  ro: {
    // Common/Shared UI elements
    common: {
      buttons: {
        save: "Salvează",
        cancel: "Anulează",
        delete: "Șterge",
        edit: "Editează",
        back: "Înapoi",
        next: "Următorul",
        continue: "Continuă",
        done: "Gata",
        close: "Închide",
        open: "Deschide",
        download: "Descarcă",
        copy: "Copiază",
        copied: "Copiat",
        loading: "Se încarcă...",
        submit: "Trimite",
        confirm: "Confirmă",
        dismiss: "Închide",
        retry: "Încearcă din nou",
        refresh: "Reîmprospătează",
      },
      labels: {
        name: "Nume complet",
        email: "Email",
        password: "Parolă",
        confirmPassword: "Confirmă parola",
        role: "Rol",
        grade: "Clasă",
        subject: "Materie",
        title: "Titlu",
        status: "Status",
        date: "Dată",
        search: "Caută",
        filter: "Filtrează",
        sort: "Sortează",
        select: "Selectează",
        optional: "Opțional",
        required: "Obligatoriu",
      },
      messages: {
        loading: "Se încarcă...",
        error: "A apărut o eroare",
        success: "Succes",
        noData: "Nu există date",
        notFound: "Nu a fost găsit",
        saved: "Salvat cu succes",
        deleted: "Șters cu succes",
        updated: "Actualizat cu succes",
        today: "Astăzi",
        yesterday: "Ieri",
      },
      status: {
        draft: "Ciornă",
        "fact-checkneeded": "Necesită verificare",
        "fact-checkpending": "Verificare în așteptare",
        ready: "Gata",
      },
    },

    // Authentication pages
    auth: {
      login: {
        title: "Bun venit înapoi",
        description: "Introdu datele pentru a te conecta",
        emailLabel: "Email",
        passwordLabel: "Parolă",
        submitButton: "Conectează-te",
        googleButton: "Continuă cu Google",
        orContinueWith: "Sau continuă cu",
        noAccount: "Nu ai cont?",
        signUpLink: "Înregistrează-te",
        forgotPassword: "Ai uitat parola?",
        errors: {
          invalidCredentials: "Email sau parolă incorectă",
          userNotFound: "Utilizatorul nu a fost găsit",
          wrongPassword: "Parolă incorectă",
          networkError: "Eroare de rețea. Te rugăm să încerci din nou.",
        },
      },
      register: {
        title: "Creează un cont",
        description: "Introdu informațiile pentru a începe",
        nameLabel: "Nume complet",
        emailLabel: "Email",
        passwordLabel: "Parolă",
        confirmPasswordLabel: "Confirmă parola",
        roleLabel: "Rol",
        gradeLabel: "Clasă",
        teachingFieldLabel: "Domeniul de predare",
        submitButton: "Înregistrează-te",
        googleButton: "Continuă cu Google",
        hasAccount: "Ai deja cont?",
        signInLink: "Conectează-te",
        passwordRequirements: {
          title: "Parola trebuie să conțină:",
          minLength: "Cel puțin 8 caractere",
          uppercase: "O literă mare",
          lowercase: "O literă mică",
          number: "O cifră",
          special: "Un caracter special",
        },
        passwordMatch: "✓ Parolele se potrivesc",
        emailVerification: "Cont creat! Te rugăm să verifici emailul pentru a verifica contul.",
        errors: {
          emailExists: "Acest email este deja înregistrat",
          weakPassword: "Parola este prea slabă",
          invalidEmail: "Te rugăm să introduci un email valid",
          passwordsDontMatch: "Parolele nu se potrivesc",
          gradeRequired: "Te rugăm să selectezi clasa",
          teachingFieldRequired: "Te rugăm să selectezi domeniul de predare",
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

    // Navigation
    nav: {
      dashboard: "Dashboard",
      myLessons: "Lecțiile mele",
      studentsView: "Elevii",
      account: "Cont",
      profile: "Profil",
      logout: "Deconectare",
      menu: "Meniu",
    },

    // Profile page
    profile: {
      title: "Profil",
      profileInfo: "Informații profil",
      accountDetails: "Detalii cont",
      editProfile: "Editează profilul",
      saveChanges: "Salvează modificările",
      accountCreated: "Cont creat",
      authMethod: "Metodă de autentificare",
      noProfileData: "Nu există date de profil.",
      tryAgain: "Încearcă din nou",
      refreshPage: "Reîmprospătează pagina",
      signOut: "Deconectează-te",
      loading: "Se încarcă profilul...",
    },

    // Teacher Dashboard
    teacherDashboard: {
      title: "Dashboard",
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
    },

    // Teacher Lessons page
    teacherLessons: {
      title: "Lecțiile mele",
      description: "Toate lecțiile create de tine, organizate pe clase",
      empty: "Nu există lecții pentru această clasă.",
      createFirst: "Creează prima ta lecție pentru a începe.",
      filterByGrade: "Filtrează după clasă",
      allGrades: "Toate clasele",
    },

    // Teacher Students page
    teacherStudents: {
      title: "Elevii",
      description: "Vezi toți elevii înscriși la clasele tale, organizați pe clase.",
      empty: {
        title: "Nu există elevi înscriși",
        description: "Nu ai elevi înscriși încă. Distribuie codul tău de profesor elevilor pentru ca aceștia să se alăture clasei tale.",
        teacherCode: "Codul tău de profesor:",
      },
      student: "elev",
      students: "elevi",
    },

    // Lesson Creation Wizard
    lessonWizard: {
      progress: {
        step: "Pasul",
        of: "din",
      },
      step1: {
        title: "Definește lecția",
        lessonTitle: "Titlul lecției",
        gradeLevel: "Clasă/Nivel",
        subject: "Materie",
        duration: "Durată",
        learningObjectives: "Obiective de învățare",
        addObjective: "Adaugă obiectiv",
        exampleTitle: "Exemplu de configurare bună a lecției",
        exampleDescription: "EduAgent folosește obiectivele tale pentru a genera conținut țintit și a asigura alinierea cu obiectivele tale de predare.",
        errors: {
          titleRequired: "Titlul lecției este obligatoriu",
          gradeRequired: "Clasa este obligatorie",
          subjectRequired: "Materia este obligatorie",
        },
      },
      step2: {
        title: "Încarcă / Selectează surse",
        primaryReference: "Material de referință principal",
        uploadDescription: "Încarcă fișiere sau lipește conținut text",
        dragDrop: "Trage și plasează fișiere PDF sau DOCX aici",
        browseFiles: "Răsfoiește fișiere",
        pasteText: "Sau lipește fragment din manual / notițe",
        trustedSources: "Surse de încredere",
        trustedSourcesDescription: "Selectează surse suplimentare pentru verificarea faptelor",
        useCurriculum: "Folosește standardele oficiale ale curriculumului (dacă sunt disponibile)",
        useReputable: "Folosește site-uri enciclopedice/științifice de încredere",
        addUrls: "Adaugă URL-uri specifice (separate prin virgulă)",
        aboutSources: "Despre surse",
        aboutSourcesDescription: "EduAgent prioritizează aceste surse la generarea și verificarea conținutului. Cu cât oferi mai multe surse relevante, cu atât lecția ta va fi mai precisă și mai aliniată.",
      },
      step3: {
        title: "Generarea lecției tale…",
        description: "Acest lucru poate dura câteva momente. Te rugăm să nu închizi această pagină.",
        steps: {
          understanding: "Înțelegerea cererii",
          researching: "Cercetarea subiectului",
          drafting: "Redactarea rezumatului pentru elevi",
          slides: "Crearea structurii slide-urilor",
          guidelines: "Scrierea ghidurilor pentru profesori",
          factcheck: "Rularea verificărilor de fapte",
        },
        stepDescriptions: {
          understanding: "Analizarea cerințelor și obiectivelor lecției tale...",
          researching: "Scanarea PDF-ului încărcat și a surselor de încredere...",
          drafting: "Crearea unui rezumat clar, potrivit vârstei pentru elevi...",
          slides: "Organizarea conținutului în slide-uri de prezentare structurate...",
          guidelines: "Pregătirea notițelor de predare și a sugestiilor de activități...",
          factcheck: "Verificarea faptelor față de sursele de încredere...",
        },
        complete: "Poți revizui și ajusta tot conținutul înainte de a-l partaja cu elevii.",
        continueButton: "Continuă la rezumatul de verificare",
      },
      step4: {
        title: "Rezumat verificare fapte",
        description: "Revizuiește prezentarea generală a calității înainte de a intra în editorul detaliat",
        status: {
          highConfidence: "Încredere ridicată",
          needsReview: "Necesită revizuire",
          criticalIssues: "Probleme critice găsite",
        },
        claimsVerified: "Fapte verificate",
        outdatedFacts: "Fapte potențial învechite",
        unsupportedStatements: "Afirmații nejustificate",
        topFlaggedIssues: "Probleme marcate principale",
        noIssues: "Nu au fost găsite probleme!",
        continueToEditor: "Continuă la editorul detaliat",
        regenerate: "Regenerează cu surse diferite",
        willSeeHighlighted: "Vei vedea acest lucru evidențiat în editor.",
      },
      step5: {
        title: "Ciorna lecției tale este gata",
        description: "Poți încă edita conținutul și rula verificări detaliate de fapte pe ecranul următor.",
        openInEditor: "Deschide în editor",
      },
    },

    // Lesson Editor
    lessonEditor: {
      title: "Editor lecție",
      metadata: "Metadate",
      runFactCheck: "Rulează verificare fapte din nou",
      markAsReady: "Marchează ca gata",
      tabs: {
        studentSummary: "Rezumat elev",
        slides: "Slide-uri",
        teacherGuidelines: "Ghiduri profesor",
      },
      deleteLesson: "Șterge lecția",
      saveDraft: "Salvează ciorna",
      deleteConfirm: {
        title: "Eștii sigur?",
        description: "Această acțiune nu poate fi anulată. Aceasta va șterge permanent lecția și toate datele asociate.",
        cancel: "Anulează",
        delete: "Șterge",
      },
    },

    // Student Summary Tab
    studentSummaryTab: {
      title: "Rezumat elev",
      placeholder: "Introdu rezumatul pentru elevi aici...",
      analysis: {
        title: "Analiză",
        readingLevel: "Nivel de lectură",
        readingTime: "Timp estimat de lectură",
        paragraphCount: "Număr de paragrafe",
        headingsUsed: "Titluri folosite",
        factCheckIssues: "Probleme de verificare fapte",
        flagged: "marcate",
      },
      issue: {
        critical: "Critic",
        warning: "Avertisment",
        dismiss: "Închide",
      },
    },

    // Slides Tab
    slidesTab: {
      title: "Slide-uri",
      slideNumber: "Slide",
      of: "din",
      slideTitle: "Titlul slide-ului",
      content: "Conținut (folosește bullet points: - sau * pentru elemente de listă)",
      contentPlaceholder: "Introdu conținutul slide-ului...\n\nFolosește bullet points:\n- Punct 1\n- Punct 2\n* Punct 3",
      imageDescription: "Adaugă descriere imagine (opțional)",
      imageDescriptionPlaceholder: "Descrie o imagine de inclus pe acest slide...",
      imageDescriptionHelp: "Acest lucru ajută la generarea sau selectarea imaginilor potrivite pentru slide.",
      newSlide: "Slide nou",
      deleteSlide: "Șterge slide",
      bullets: "bullet points",
    },

    // Teacher Guidelines Tab
    teacherGuidelinesTab: {
      teacherOnly: "Conținut doar pentru profesori — elevii nu văd acest lucru.",
      sections: {
        objectives: {
          title: "Obiective lecție",
          placeholder: "Listează obiectivele de învățare pentru această lecție...",
        },
        timing: {
          title: "Timing și ritm",
          placeholder: "0-10 min: Introducere\n10-25 min: Activitate principală\n25-45 min: Exersare...",
        },
        questions: {
          title: "Întrebări sugerate",
          placeholder: "Ce crezi că se întâmplă când...?\nCum ai explica...?",
        },
        differentiation: {
          title: "Sfaturi de diferențiere",
          placeholder: "Pentru elevi cu dificultăți: ...\nPentru elevi avansați: ...",
        },
        assessment: {
          title: "Idei de evaluare",
          placeholder: "Bilet de ieșire: ...\nVerificare rapidă: ...",
        },
      },
    },

    // Fact Check Panel
    factCheckPanel: {
      title: "Verificare fapte și revizuire calitate",
      subtitle: "Inspectează problemele identificate și acționează asupra lor",
      summary: {
        title: "Rezumat",
        status: {
          highConfidence: "Încredere ridicată",
          needsReview: "Necesită revizuire",
          criticalIssues: "Probleme critice găsite",
        },
        claimsVerified: "Fapte verificate",
        outdatedFacts: "Fapte potențial învechite",
        unsupportedStatements: "Afirmații nejustificate",
      },
      filters: {
        title: "Filtre",
        all: "Toate",
        warningsOnly: "Doar avertismente",
        criticalOnly: "Doar critice",
      },
      claims: {
        title: "Afirmații marcate",
        location: {
          summary: "Rezumat",
          slides: "Slide-uri",
          teacherGuide: "Ghid profesor",
          slide: "Slide",
        },
        fullClaim: "Afirmație completă:",
        reason: "Motiv:",
        sourcesConsulted: "Surse consultate:",
        askToFix: "Cere EduAgent să corecteze",
        fixing: "Se corectează…",
        markAccepted: "Marchează ca acceptat",
        editManually: "Editează manual",
        noClaims: "Nu există afirmații marcate.",
        expand: "Extinde",
        collapse: "Restrânge",
      },
      preview: {
        tabs: {
          studentSummary: "Rezumat elev",
          slides: "Slide-uri",
          teacherGuidelines: "Ghiduri profesor",
        },
      },
    },

    // Export & Share Modal
    exportShareModal: {
      title: "Lecția ta este gata de partajat",
      downloads: {
        title: "Descărcări",
        studentSummary: "Descarcă rezumat elev (PDF)",
        slides: "Descarcă slide-uri (PPTX sau PDF)",
        teacherGuide: "Descarcă ghid profesor (PDF)",
        downloadButton: "Descarcă",
      },
      share: {
        title: "Partajează cu elevi",
        classLink: "Link clasă",
        classCode: "Cod clasă",
        copyLink: "Copiază link",
        copyCode: "Copiază cod",
        codeHelp: "Elevii pot folosi acest cod pentru a accesa lecția",
      },
      studentView: {
        title: "Opțiuni vizualizare elev",
        showSources: "Permite elevilor să vadă sursele folosite",
        showQuiz: "Afișează quiz după citirea rezumatului",
        on: "Pornit",
        off: "Oprit",
      },
      buttons: {
        backToEditor: "Înapoi la editor",
        done: "Gata",
      },
    },

    // Teaching fields (for registration)
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

    // Grades
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

    // Subjects
    subjects: {
      "Science": "Științe",
      "Mathematics": "Matematică",
      "History": "Istorie",
      "English": "Engleză",
      "Geography": "Geografie",
      "Art": "Arte",
      "Music": "Muzică",
      "Physical Education": "Educație fizică",
      "Computer Science": "Informatică",
      "Foreign Language": "Limba străină",
      "Other": "Altele",
    },

    // Durations
    durations: {
      "20 minutes": "20 minute",
      "30 minutes": "30 minute",
      "45 minutes": "45 minute",
      "60 minutes": "60 minute",
    },
  },
};

// Type for translation keys (for type safety)
export type TranslationKey = keyof typeof translations.ro;

// Helper function to get translation (can be extended for i18n)
export function t(key: string, lang: "ro" = "ro"): string {
  const keys = key.split(".");
  let value: any = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return typeof value === "string" ? value : key;
}

// Export default Romanian translations for easy access
export default translations.ro;

