
"use client";
/**
 * @fileOverview This file contains the PapersPage component, which allows users
 * to find and download previous years' question papers for various exams.
 * The paper links are stored in a static object.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * @const {object} paperLinks
 * @description A nested object containing links to PDF question papers, organized by
 * exam, stream, and year. A '#' value indicates that a paper is not available.
 */
const paperLinks: Record<string, Record<string, Record<string, string>>> = {
    "Graduate Aptitude Test In Engineering (GATE)": {
        "Aerospace Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/AE.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Aerospace_Engineering_Question_Paper_41c06663f62e59287ea25fed73d72694.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/AE_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ae_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ae_2021.pdf"
        },
        "Agricultural Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/AG.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Agricultural_Engineering_Question_Paper_57de5bd588bdd2a316d4bdf03a7cb976.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/AG_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ag_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ag_2021.pdf"
        },
        "Architecture and Planning": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/AR.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Architecture_and_Planning_Question_Paper_aff760e0e7cb39003f2513f15e6a8e3f.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/AR_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ar_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ar_2021.pdf"
        },
        "Biomedical Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/BM.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Biomedical_Engineering_Question_Paper_1ece417fbe7a8f3c5703a556ffdc58cd.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/BM_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/bm_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/bm_2021.pdf"
        },
        "Biotechnology": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/BT.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Biotechnology_Question_Paper_a5134d4c736090be9754dc02a70246df.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/BT_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/bt_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/bt_2021.pdf"
        },
        "Civil Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/CE1.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Civil_Engineering_Question_Paper_Slot_1_9b1aea1a08b2bdccee873c6aef9af18c.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/CE1_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ce_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ce_2021.pdf"
        },
        "Chemical Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/CH.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Chemical_Engineering_Question_Paper_4c341bda40075e7bfc30be9d65ba02f1.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/CH_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ch_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ch_2021.pdf"
        },
        "Computer Science and Information Technology": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/CS1.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_CSE_Question_Paper_Slot_1_eaf7a4bd923ba5eb7772c7907cdc777b.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/CS_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/cs_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/cs_2021.pdf"
        },
        "Chemistry": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/CY.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Chemistry_Question_Paper_e414259392a66cafbbb02cf2d48c6920.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/CY_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/cy_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/cy_2021.pdf"
        },
        "Data Science and Artificial intelligence": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/DA.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Data_Science_and_Artificial_Intelligence_Question_Paper_81cdb8440a48fc6d5af200aaf670084a.pdf",
            "2023": "#",
            "2022": "#",
            "2021": "#"
        },
        "Electronics and Communication Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/EC.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_ECE_Question_Paper_db4d5f96c15e227fd922b74bb820b78f.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/EC_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ec_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ec_2021.pdf"
        },
        "Electrical Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/EE.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_EE_Question_Paper_f6a2514d1c6396248a2c0f1a8cf60a24.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/EE_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ee_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ee_2021.pdf"
        },
        "Environmental Science and Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/ES.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Environmental_Science_and_Engineering_Question_Paper_63adbe8dd23d25c155f8a6a33e54fa83.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/ES_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/es_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/es_2021.pdf"
        },
        "Ecology and Evolution": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/EY.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Ecology_and_Evolution_Question_Paper_8076da75d75f80bc48fc9edbe67592f2.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/EY_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ey_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ey_2021.pdf"
        },
        "Geomatics Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/GE.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Geomatics_Engineering_Question_Paper_573c50e58db3d145012d17d8c23b3752.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/GE_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ge_2022.pdf",
            "2021": "#"
        },
        "Geology and Geophysics": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/GG-1.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Geology_Question_Paper_74a1c6a86595e850e03521169d8eef81.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/GG_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/gg_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/gg_2021.pdf"
        },
        "Instrumentation Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/IN.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Instrumentation_Engineering_Question_Paper_33c5cc8334d333699753bf490dec7eb0.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/IN_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/in_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/in_2021.pdf"
        },
        "Mathematics": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/MA.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Mathematics_Question_Paper_e9bba58b2bf78e57999ad2316d1b2f45.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/MA_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ma_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ma_2021.pdf"
        },
        "Mechanical Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/ME.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Mechanical_Engineering_Question_Paper_e83a65ea2257e90c407976e55d96cf3e.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/ME_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/me_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/me_2021.pdf"
        },
        "Mining Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/MN.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Mining_Engineering_Question_Paper_b6a4c331983807f7f28ffcb6f9207165.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/MN_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/mn_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/mn_2021.pdf"
        },
        "Metallurgical Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/MT.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Metallurgical_Engineering_Question_Paper_90f66942cc4c41167c518a79adbbe788.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/MT_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/mt_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/mt_2021.pdf"
        },
        "Naval Architecture and Marine Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/NM.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Naval_Architecture_and_Marine_Engineering_Question_Paper_2e0f2fb3e771b908a63183de0ca7df65.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/NM_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/nm_2022.pdf",
            "2021": "#"
        },
        "Petroleum Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/PE.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Petroleum_Engineering_Question_Paper_e91edffeb149650f16f101753ce20142.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/PE_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/pe_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/pe_2021.pdf"
        },
        "Physics": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/PH.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Physics_Question_Paper_4e6247cfccb68ccd533984eb4a5cb965.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/PH_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/ph_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/ph_2021.pdf"
        },
        "Production and Industrial Engineering": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/PI.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Production_and_Industrial_Engineering_Question_Paper_19e4ec0e491b23179617e8af5225bb2b.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/PI_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/pi_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/pi_2021.pdf"
        },
        "Statistics": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/ST.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Statistics_Question_Paper_887f8539227732059533c4823ae3a7ac.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/ST_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/st_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/st_2021.pdf"
        },
        "Textile Engineering and Fibre Science": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/TF.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Textile_Engineering_and_Fibre_Science_Question_Paper_0adbe6b6b7820e58a3579f3ca5f36923.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/TF_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/tf_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/tf_2021.pdf"
        },
        "Engineering Sciences": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/XE.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Engineering_Sciences_Question_Paper_b2430f06ae06f87c3803018f1c754555.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/XE_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/xe_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/xe_2021.pdf"
        },
        "Humanities and Social Sciences": {
            "2025": "https://gate2025.iitr.ac.in/doc/2025/2025_QP/XH-C1.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Economics_XH_C1_Question_Paper_e8d2f113cacafad583a4c7bc903f1848.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/XH_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/xh_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/xh_2021.pdf"
        },
        "Life Sciences": {
            "2025": "http://gate2025.iitr.ac.in/doc/2025/2025_QP/XL.pdf",
            "2024": "https://assets.collegedunia.com/public/image/GATE_2024_Life_Sciences_Question_Paper_df69749454a5ca100ccc0811f20ae070.pdf",
            "2023": "https://gate.iitk.ac.in/GATE2023/doc/papers/2023/XL_GATE2023.pdf",
            "2022": "https://gate.iitk.ac.in/GATE2023/doc/papers/2022/xl_2022.pdf",
            "2021": "https://gate.iitk.ac.in/GATE2023/doc/papers/2021/xl_2021.pdf"
        },
    },
    "JEE Main": {
        "JEE Main": { 
            "2025":"https://nta.ac.in/Download/ExamPaper/Paper_20250530112357.pdf",
            "2024": "https://nta.ac.in/Download/ExamPaper/Paper_20250910115805.pdf",
            "2023": "https://nta.ac.in/Download/ExamPaper/Paper_20250306190223.pdf",
            "2022": "https://nta.ac.in/Download/ExamPaper/Paper_20230320112124.pdf",
            "2021": "https://nta.ac.in/Download/ExamPaper/Paper_20210322114016.pdf",
        }
    },
    "Common Admission Test (CAT)": {
        "CAT": {
            "2023": "https://iimcat.ac.in/uploads/question_paper_and_answer_key/CAT2023_QP_and_Ans_Key.pdf",
            "2022": "https://iimcat.ac.in/uploads/question_paper_and_answer_key/CAT2022_QP_and_Ans_Key.pdf",
            "2021": "https://iimcat.ac.in/uploads/question_paper_and_answer_key/CAT2021_QP_Ans_Key.pdf",
        }
    },
     "National Eligibility Cum Entrance Test (NEET)": {
        "NEET": {
            "2025":"https://nta.ac.in/Download/ExamPaper/Paper_20250124132902.pdf",
            "2024": "https://nta.ac.in/Download/ExamPaper/Paper_20250124132822.pdf",
            "2023": "https://nta.ac.in/Download/ExamPaper/Paper_20231108004734.pdf",
            "2021": "https://nta.ac.in/Download/ExamPaper/Paper_20211218094555.pdf",
        }
    }
};

/**
 * @component PapersPage
 * @description A page component that allows users to select an exam and a stream/subject
 * to find and download past question papers.
 */
export default function PapersPage() {
    const [selectedExam, setSelectedExam] = useState<string | null>(null);
    const [selectedStream, setSelectedStream] = useState<string | null>(null);
    const [streams, setStreams] = useState<string[]>([]);
    const [filteredPapers, setFilteredPapers] = useState<Record<string, string>>({});
    const [showStreamSelector, setShowStreamSelector] = useState(false);

    /**
     * Finds and sets the available papers based on the selected exam and stream.
     * @param {string} exam - The name of the selected exam.
     * @param {string | null} stream - The name of the selected stream/subject.
     */
    const findPapers = (exam: string, stream: string | null) => {
        const examPapers = paperLinks[exam];
        if (!examPapers) {
            setFilteredPapers({});
            return;
        }

        const streamToUse = stream || Object.keys(examPapers)[0];
        const papers = examPapers[streamToUse] || {};
        setFilteredPapers(papers);
    };

    /**
     * Handles the change event for the exam selection dropdown.
     * @param {string} examName - The newly selected exam name.
     */
    const handleExamChange = (examName: string) => {
        setSelectedExam(examName);
        const paperStreams = paperLinks[examName] ? Object.keys(paperLinks[examName]) : [];
        setStreams(paperStreams);
        setSelectedStream(null);
        setFilteredPapers({});

        // Show the stream selector only if there are multiple streams for the exam.
        if (paperStreams.length > 1) {
            setShowStreamSelector(true);
        } else {
            setShowStreamSelector(false);
            findPapers(examName, paperStreams[0] || null);
        }
    };

    /**
     * Handles the change event for the stream/subject selection dropdown.
     * @param {string} streamName - The newly selected stream name.
     */
    const handleStreamChange = (streamName: string) => {
        setSelectedStream(streamName);
        if (selectedExam) {
            findPapers(selectedExam, streamName);
        }
    };
    
    /**
     * Generates a descriptive title for the paper link.
     * @param {string | null} exam - The selected exam.
     * @param {string | null} stream - The selected stream.
     * @param {string} year - The year of the paper.
     * @returns {string} The formatted paper title.
     */
    const getPaperTitle = (exam: string | null, stream: string | null, year: string) => {
        if (!exam) return `${year} Question Paper`;
        
        const paperStreams = paperLinks[exam] ? Object.keys(paperLinks[exam]) : [];
        
        if (paperStreams.length <= 1) {
             return `${exam} ${year} Question Paper`;
        }
        
        return `${stream || exam} ${year} Question Paper`;
    }

    return (
        <div className="container mx-auto max-w-5xl py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight lg:text-5xl font-headline">
                    Previous Year Papers
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-muted-foreground">
                    Access official question papers to sharpen your preparation.
                </p>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Find Your Paper</CardTitle>
                    <CardDescription>Select an exam and subject to find relevant papers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select onValueChange={handleExamChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an Exam" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(paperLinks).map((exam) => (
                                    <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {showStreamSelector && (
                            <Select onValueChange={handleStreamChange} value={selectedStream || ""} disabled={!selectedExam}>
                                 <SelectTrigger>
                                    <SelectValue placeholder="Select Stream / Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {streams.map((stream) => (
                                        <SelectItem key={stream} value={stream}>{stream}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                
                    {selectedExam && (Object.keys(filteredPapers).length > 0 ? (
                        <div className="space-y-3 pt-4">
                           <h3 className="text-lg font-semibold flex items-center gap-2">
                               <FileText className="h-5 w-5 text-accent" />
                               Available Papers for {showStreamSelector ? selectedStream : selectedExam}
                            </h3>
                            {Object.entries(filteredPapers).sort((a,b) => parseInt(b[0]) - parseInt(a[0])).map(([year, url]) => (
                                <Button asChild variant="outline" className="w-full justify-between" key={year} disabled={url === "#"}>
                                    <a href={url} download={`${getPaperTitle(selectedExam, selectedStream, year).replace(/\s+/g, '-')}-Paper.pdf`} target="_blank" rel="noopener noreferrer">
                                        {getPaperTitle(selectedExam, selectedStream, year)}
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                            ))}
                        </div>
                    ) : selectedExam && (!showStreamSelector || selectedStream) ? (
                         <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed rounded-lg mt-4">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold text-muted-foreground">No Papers Found</h3>
                            <p className="text-muted-foreground mt-1 text-sm">Sorry, we couldn't find any papers for the selected option.</p>
                        </div>
                    ) : null
                )}
                </CardContent>
            </Card>
        </div>
    );
}
