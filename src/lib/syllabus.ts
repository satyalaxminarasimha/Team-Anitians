/**
 * @fileOverview This file contains the syllabus data for all supported exams.
 * It exports a `examMap`, which is a Map object where keys are exam names
 * and values are objects containing the streams/subjects for that exam.
 */

/**
 * @interface Exam
 * @description Defines the structure for an exam's data.
 * @property {Map<string, string>} streams - A map where keys are stream/subject names and values are the syllabus strings.
 * @property {boolean} [selectableStreams] - If true (or undefined), the UI will show a stream selector. If false, it will combine all syllabi.
 */
export interface Exam {
  streams: Map<string, string>;
  selectableStreams?: boolean;
}

/**
 * @const {Map<string, Exam>} examMap
 * @description The main data structure holding all exam and syllabus information.
 */
export const examMap = new Map<string, Exam>([
  [
    "Graduate Aptitude Test In Engineering (GATE)",
    {
      streams: new Map([
        [
          "Computer Science and Information Technology",
          "Engineering Mathematics, Digital Logic, Computer Organization and Architecture, Programming and Data Structures, Algorithms, Theory of Computation, Compiler Design, Operating System, Databases, Computer Networks",
        ],
        [
          "Mechanical Engineering",
          "Engineering Mathematics, Applied Mechanics and Design (Engineering Mechanics, Mechanics of Materials, Theory of Machines, Vibrations, Machine Design), Fluid Mechanics and Thermal Sciences (Fluid Mechanics, Heat-Transfer, Thermodynamics, Applications), Materials, Manufacturing and Industrial Engineering (Engineering Materials, Casting, Forming and Joining Processes, Machining and Machine Tool Operations, Metrology and Inspection, Computer Integrated Manufacturing, Production Planning and Control, Inventory Control, Operations Research)",
        ],
        [
          "Electrical Engineering",
          "Engineering Mathematics, Electric circuits, Electromagnetic Fields, Signals and Systems, Electrical Machines, Power Systems, Control Systems, Electrical and Electronic Measurements, Analog and Digital Electronics, Power Electronics",
        ],
        [
          "Civil Engineering",
          "Engineering Mathematics, Structural Engineering (Engineering Mechanics, Solid Mechanics, Structural Analysis, Construction Materials and Management, Concrete Structures, Steel Structures), Geotechnical Engineering (Soil Mechanics, Foundation Engineering), Water Resources Engineering (Fluid Mechanics, Hydrology, Irrigation), Environmental Engineering (Water and Waste Water, Air Pollution, Municipal Solid Wastes, Noise Pollution), Transportation Engineering (Transportation Infrastructure, Highway Pavements, Traffic Engineering), Geomatics Engineering (Principles of surveying, Maps, Surveying measurements)",
        ],
        [
          "Electronics and Communication Engineering",
          "Engineering Mathematics, Networks, Signals and Systems, Electronic Devices, Analog Circuits, Digital Circuits, Control Systems, Communications, Electromagnetics",
        ],
        [
          "Aerospace Engineering",
          "Engineering Mathematics, Flight Mechanics, Space Dynamics, Aerodynamics, Propulsion, Structures",
        ],
        [
          "Biotechnology",
          "Engineering Mathematics, General Biology, Genetics, Cellular and Molecular Biology, Fundamentals of Biological Engineering, Bioprocess Engineering and Process Biotechnology, Plant, Animal and Microbial Biotechnology, Recombinant DNA technology and Other Tools in Biotechnology",
        ],
        [
          "Chemical Engineering",
          "Engineering Mathematics, Process Calculations and Thermodynamics, Fluid Mechanics and Mechanical Operations, Heat Transfer, Mass Transfer, Chemical Reaction Engineering, Instrumentation and Process Control, Plant Design and Economics, Chemical Technology",
        ],
        [
          "Data Science and Artificial intelligence",
          "Probability and Statistics, Linear Algebra, Calculus and Optimization, Programming, Data Structures and Algorithms, Database Management and Warehousing, Machine Learning, Artificial Intelligence",
        ],
      ]),
    },
  ],
  [
    "JEE Main",
    {
      streams: new Map([
        ["Physics", "Physics and Measurement, Kinematics, Laws of Motion, Work, Energy and Power, Rotational Motion, Gravitation, Properties of Solids and Liquids, Thermodynamics, Kinetic Theory of Gases, Oscillations and Waves, Electrostatics, Current Electricity, Magnetic Effects of Current and Magnetism, Electromagnetic Induction and Alternating Currents, Electromagnetic Waves, Optics, Dual Nature of Matter and Radiation, Atoms and Nuclei, Electronic Devices"],
        ["Chemistry", "Some Basic Concepts in Chemistry, States of Matter, Atomic Structure, Chemical Bonding and Molecular Structure, Chemical Thermodynamics, Solutions, Equilibrium, Redox Reactions and Electrochemistry, Chemical Kinetics, Surface Chemistry, Classification of Elements and Periodicity in Properties, General Principles and Processes of Isolation of Metals, Hydrogen, s-Block Elements, p-Block Elements, d and f Block Elements, Coordination Compounds, Environmental Chemistry, Purification and Characterisation of Organic Compounds, Some Basic Principles of Organic Chemistry, Hydrocarbons, Organic Compounds Containing Halogens, Organic Compounds Containing Oxygen, Organic Compounds Containing Nitrogen, Polymers, Biomolecules, Chemistry in Everyday Life"],
        ["Mathematics", "Sets, Relations and Functions, Complex Numbers and Quadratic Equations, Matrices and Determinants, Permutations and Combinations, Mathematical Induction, Binomial Theorem and its Simple Applications, Sequences and Series, Limit, Continuity and Differentiability, Integral Calculus, Differential Equations, Co-ordinate Geometry, Three Dimensional Geometry, Vector Algebra, Statistics and Probability, Trigonometry, Mathematical Reasoning"],
      ]),
      selectableStreams: false, // The UI should not show a stream selector for JEE Main.
    },
  ],
  [
    "Banking Exams (IBPS PO)",
    {
      streams: new Map([
        ["Quantitative Aptitude", "Number Series, Data Interpretation, Simplification/Approximation, Quadratic Equation, Data Sufficiency, Mensuration, Average, Profit and Loss, Ratio and Proportion, Work, Time and Energy, Time and Distance, Probability, Relations, Simple and Compound Interest, Permutation and Combination"],
        ["Reasoning Ability", "Puzzles, Seating Arrangements, Direction Sense, Blood Relation, Syllogism, Order and Ranking, Coding-Decoding, Machine Input-Output, Inequalities, Alpha-Numeric-Symbol Series, Data Sufficiency, Logical Reasoning"],
        ["English Language", "Reading Comprehension, Cloze Test, Fillers, Spotting Errors, Sentence Improvement, Sentence Correction, Para Jumbles, Para/Sentence Completion, Vocabulary"],
        ["General Awareness", "Banking and Financial Awareness, Current Affairs, Static GK (Countries & Capitals, Currencies, Important Dates, Awards, etc.)"],
      ]),
      selectableStreams: false,
    },
  ],
  [
    "National Eligibility Cum Entrance Test (NEET)",
    {
      streams: new Map([
        ["Physics", "Physical-world and measurement, Kinematics, Laws of Motion, Work, Energy and Power, Motion of System of Particles and Rigid Body, Gravitation, Properties of Bulk Matter, Thermodynamics, Behaviour of Perfect Gas and Kinetic Theory, Oscillations and Waves, Electrostatics, Current Electricity, Magnetic Effects of Current and Magnetism, Electromagnetic Induction and Alternating Currents, Electromagnetic Waves, Optics, Dual Nature of Matter and Radiation, Atoms and Nuclei, Electronic Devices"],
        ["Chemistry", "Some Basic Concepts of Chemistry, Structure of Atom, Classification of Elements and Periodicity in Properties, Chemical Bonding and Molecular Structure, States of Matter: Gases and Liquids, Thermodynamics, Equilibrium, Redox Reactions, Hydrogen, s-Block Element (Alkali and Alkaline earth metals), Some p-Block Elements, Organic Chemistry- Some Basic Principles and Techniques, Hydrocarbons, Environmental Chemistry, Solid State, Solutions, Electrochemistry, Chemical Kinetics, Surface Chemistry, General Principles and Processes of Isolation of Elements, p- Block Elements, d and f Block Elements, Coordination Compounds, Haloalkanes and Haloarenes, Alcohols, Phenols and Ethers, Aldehydes, Ketones and Carboxylic Acids, Organic Compounds Containing Nitrogen, Biomolecules, Polymers, Chemistry in Everyday Life"],
        ["Biology", "Diversity in Living World, Structural Organisation in Animals and Plants, Cell Structure and Function, Plant Physiology, Human physiology, Reproduction, Genetics and Evolution, Biology and Human Welfare, Biotechnology and Its Applications, Ecology and environment"],
      ]),
      selectableStreams: false,
    },
  ],
  [
    "Common Admission Test (CAT)",
    {
      streams: new Map([
        ["Verbal Ability & Reading Comprehension", "Para Jumbles, Para Summary, Sentence Completion, Odd Sentence Out, Reading Comprehension Passages"],
        ["Data Interpretation & Logical Reasoning", "Tables, Bar Graphs, Line Charts, Pie Charts, Caselets, Seating Arrangement, Blood Relations, Syllogisms, Venn Diagrams"],
        ["Quantitative Aptitude", "Number System, Arithmetic (Percentage, Profit & Loss, Time & Work, Time Speed Distance), Algebra, Geometry, Mensuration, Modern Math (Permutation & Combination, Probability)"],
      ]),
      selectableStreams: false,
    },
  ],
  [
    "Civil Services Examination (UPSC CSE)",
    {
      streams: new Map([
        ["General Studies Paper I", "Current events of national and international importance, History of India and Indian National Movement, Indian and World Geography, Indian Polity and Governance, Economic and Social Development, General issues on Environmental ecology, Bio-diversity and Climate Change, General Science"],
        ["General Studies Paper II (CSAT)", "Comprehension, Interpersonal skills including communication skills, Logical reasoning and analytical ability, Decision making and problem solving, General mental ability, Basic numeracy, English Language Comprehension skills (Class X level)"],
      ]),
      selectableStreams: false,
    },
  ],
  [
    "Common Law Admission Test (CLAT)",
    {
      streams: new Map([
        ["English Language", "Reading Comprehension, Passages, Grammar, Vocabulary, Synonyms, Antonyms"],
        ["Current Affairs & General Knowledge", "Contemporary events of significance from India and the world, Arts and culture, International affairs, Historical events of continuing significance"],
        ["Legal Reasoning", "Rules and principles of law, Applying rules and principles to various fact situations, understanding legal arguments"],
        ["Logical Reasoning", "Relationships and analogies, logical sequences, syllogisms, drawing conclusions"],
        ["Quantitative Techniques", "Ratios and proportions, basic algebra, mensuration, statistical estimation, graphs, numerical information"],
      ]),
      selectableStreams: false,
    },
  ],
]);
