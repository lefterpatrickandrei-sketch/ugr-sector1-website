/**
 * =========================================================================
 * FIȘIER DE DATE - UNIUNEA GEODEZILOR DIN ROMÂNIA (FILIALA SECTOR 1)
 * =========================================================================
 * Acest fișier conține toate datele editabile ale site-ului.
 * Orice persoană (chiar și fără cunoștințe de programare) poate deschide 
 * acest fișier în Notepad sau orice alt editor de text pentru a adăuga, 
 * șterge sau modifica membri, știri, documente sau date de conducere.
 * 
 * REGULI DE AUR PENTRU EDITARE:
 * 1. Păstrați ghilimelele în jurul textelor. (ex: "Popescu Ion")
 * 2. Puneți virgulă la finalul fiecărui element dintr-o listă.
 * 3. Folosiți diacritice românești (ș, ț, â, î, ă) - fișierul este salvat ca UTF-8.
 * =========================================================================
 */

const ugrData = {
    // -------------------------------------------------------------------------
    // 1. DATE HĂRȚII INTERACTIVE (COORDONATE & INFORMAȚII FILIALE)
    // -------------------------------------------------------------------------
    mapNodes: {
        bucuresti: { 
            name: "București",      
            lat: 44.4323, 
            lon: 26.1063, 
            latStr: "44°26'08\"", 
            lonStr: "26°06'12\"", 
            desc: "Sediul Central administrativ și principalul nod legislativ în parteneriat cu ANCPI." 
        },
        cluj: { 
            name: "Cluj-Napoca",     
            lat: 46.7712, 
            lon: 23.6236, 
            latStr: "46°46'18\"", 
            lonStr: "23°35'47\"", 
            desc: "Nod academic intens în Transilvania și organizator regional." 
        },
        iasi: { 
            name: "Iași",            
            lat: 47.1585, 
            lon: 27.6014, 
            latStr: "47°09'44\"", 
            lonStr: "27°35'20\"", 
            desc: "Filială regională importantă conectată cu zona geodezică din Est." 
        },
        constanta: { 
            name: "Constanța",       
            lat: 44.1792, 
            lon: 28.6498, 
            latStr: "44°10'42\"", 
            lonStr: "28°38'30\"", 
            desc: "Specializată pe proiecții costiere, marină și lucrări de infrastructură portuară." 
        },
        timisoara: { 
            name: "Timișoara",       
            lat: 45.7537, 
            lon: 21.2257, 
            latStr: "45°45'13\"", 
            lonStr: "21°13'43\"", 
            desc: "Gazdă periodică a simpozioanelor și centru universitar geodezic de prestigiu." 
        },
        chisinau: { 
            name: "Chișinău (UTM)",  
            lat: 47.0012, 
            lon: 28.8514, 
            latStr: "47°01'12\"", 
            lonStr: "28°51'14\"", 
            desc: "Filială internațională recent înființată la Universitatea Tehnică a Moldovei." 
        }
    },

    // -------------------------------------------------------------------------
    // 2. FILTRARE PE COMPETENȚE/SKILL-URI PENTRU HĂRȚII
    // -------------------------------------------------------------------------
    skillMapping: {
        toate: ["bucuresti", "cluj", "iasi", "constanta", "timisoara", "chisinau"],
        lidar: ["bucuresti", "cluj", "timisoara"],
        gnss: ["bucuresti", "cluj", "iasi", "timisoara"],
        cadastru: ["bucuresti", "cluj", "iasi", "constanta", "timisoara", "chisinau"],
        gis: ["bucuresti", "cluj", "iasi", "chisinau"],
        nivelment: ["bucuresti", "constanta", "timisoara"]
    },

    // -------------------------------------------------------------------------
    // 3. CONDUCEREA ȘI CONSILIUL EXECUTIV
    // -------------------------------------------------------------------------
    leadership: [
        {
            name: "ing. Mircea Afrăsinei",
            role: "Președinte UGR (Național)",
            image: "ugr-images/Mircea-Afrsinei.jpg",
            desc: "Coordonatorul activității naționale, reprezentant oficial al comunității geodezice în parteneriatele strategice cu autoritățile publice."
        },
        {
            name: "ing. Vlad Păunescu",
            role: "Secretar Executiv UGR",
            image: "logo_geodez.png", // Sigla ca placeholder premium
            desc: "Responsabil de managementul administrativ, organizarea ședințelor Consiliului Național și menținerea legăturii cu filialele județene."
        },
        {
            name: "ing. Valeriu Man",
            role: "Vicepreședinte Regiunea Nord-Vest (Cluj)",
            image: "logo_geodez.png",
            desc: "Reprezentant regional pentru asociațiile locale din Transilvania de Nord, axat pe dezvoltare academică și profesională."
        },
        {
            name: "ing. Gheorghe Vasilică",
            role: "Vicepreședinte Regiunea Nord-Est (Iași)",
            image: "logo_geodez.png",
            desc: "Supervizează activitățile profesionale în zona de est a țării și integrarea noilor absolvenți de inginerie geodezică."
        },
        {
            name: "ing. Marian Marin",
            role: "Vicepreședinte Regiunea Sud-Est (Constanța)",
            image: "logo_geodez.png",
            desc: "Coordonator regional axat pe proiecte de infrastructură costieră, portuară și batimetrie în zona Dobrogei."
        },
        {
            name: "ing. Tiberiu Timiș",
            role: "Vicepreședinte Regiunea Vest (Timișoara)",
            image: "logo_geodez.png",
            desc: "Responsabil de regiunea Banat, axat pe organizarea simpozioanelor tehnice și promovarea tehnologiilor laser 3D/LiDAR."
        }
    ],

    // -------------------------------------------------------------------------
    // 4. TABEL MEMBRI AUTORIZAȚI (MANAGEMENT ȘI MENTENANȚĂ MEMBRI)
    // -------------------------------------------------------------------------
    // Pentru a adăuga un membru nou, copiați un bloc de mai jos și modificați datele.
    membersList: [
        {
            id: "UGR-0012",
            name: "Andrei Popescu",
            judet: "București",
            auth: "Seria RO-B-F Nr. 0244",
            status: "Activ" // Poate fi "Activ" sau "Inactiv"
        },
        {
            id: "UGR-0145",
            name: "Elena Munteanu",
            judet: "Cluj",
            auth: "Seria RO-CJ-F Nr. 1102",
            status: "Activ"
        },
        {
            id: "UGR-0312",
            name: "Vasile Lupu",
            judet: "Iași",
            auth: "Seria RO-IS-F Nr. 0984",
            status: "Activ"
        },
        {
            id: "UGR-0402",
            name: "Dumitru Crișan",
            judet: "Timiș",
            auth: "Seria RO-TM-F Nr. 1290",
            status: "Activ"
        },
        {
            id: "UGR-0589",
            name: "Mariana Marin",
            judet: "Constanța",
            auth: "Seria RO-CT-F Nr. 0451",
            status: "Activ"
        }
    ],

    // -------------------------------------------------------------------------
    // 5. ȘTIRI ȘI NOUTĂȚI (EVENIMENTE ȘI ANUNȚURI)
    // -------------------------------------------------------------------------
    newsList: [
        {
            category: "Eveniment",
            title: "Săptămâna Geodeziei Românești 2025",
            desc: "Conferința de anvergură reunește elita specialiștilor, universităților tehnice de prestigiu și partenerilor privați pentru a discuta tehnologii LIDAR și sisteme avansate cadastrale în sprijinul localităților din România.",
            location: "TIMIȘOARA, TIMIȘ",
            date: "IULIE 2025",
            image: "ugr-images/sgr-3.png" // Imagine reală descărcată din caruselul ugr.ro
        },
        {
            category: "Tehnic",
            title: "Ghid practic pentru ridicări topografice cu sisteme GNSS / RTK",
            desc: "UGR lansează un nou set de recomandări metodologice pentru utilizarea receptoarelor GNSS în vederea asigurării unei precizii de ordin milimetric în lucrările de cadastru general.",
            location: "BUCUREȘTI",
            date: "IUNIE 2025",
            image: "ugr-images/fig2020.png"
        },
        {
            category: "Legislativ",
            title: "Noutăți privind simplificarea procedurilor de recepție ANCPI",
            desc: "O nouă ordonanță de urgență urmează să fie analizată în comisiile de specialitate ale Parlamentului. UGR participă activ la formularea amendamentelor pentru sprijinirea geodezilor autorizați.",
            location: "SENATUL ROMÂNIEI",
            date: "MAI 2025",
            image: "logo_geodez.png"
        }
    ],

    // -------------------------------------------------------------------------
    // 6. FORMULARE ȘI DOCUMENTE OFICIALE DESCĂRCABILE (CERERI INSCRIERE)
    // -------------------------------------------------------------------------
    documentsList: [
        {
            title: "Cerere de Adeziune - Persoane Fizice",
            desc: "Formular tipizat pentru înscrierea geodezilor autorizați în asociația locală a UGR.",
            fileUrl: "https://www.ugr.ro/assets/upload/cerere_inscriere_UGR_persoane_fizice.docx",
            format: "DOCX (Word)"
        },
        {
            title: "Cerere de Adeziune - Persoane Juridice",
            desc: "Formular oficial dedicat companiilor din domeniul geodeziei, cadastrului și cartografiei.",
            fileUrl: "https://www.ugr.ro/assets/upload/cerere_inscriere_UGR_persoane_juridice.docx",
            format: "DOCX (Word)"
        },
        {
            title: "Declarație Acord GDPR UGR",
            desc: "Formular obligatoriu privind protecția datelor cu caracter personal pentru toți membrii înscriși.",
            fileUrl: "https://www.ugr.ro/assets/upload/statut_ugr.pdf", // Folosim pdf ca fallback
            format: "PDF (Acrobat)"
        }
    ],

    // Link-ul oficial extern de verificare a autorizațiilor ANCPI
    ancpiVerificationLink: "https://geoportal.ancpi.ro/geoportal/impartaseste/autorizati/persoaneFizice.html"
};
