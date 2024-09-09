type JobsDao = {
    id: number;
    type: string;
    memorialId: number;
    grave_number: string;
    deadline: string;
    section: string;
    sectionId: number;
    statusId: number;
    statusName: string;
    categoryId: number;
    categoryName: string;
    memorialHeightId: number;
    memorialHeightName: string;
    cemeteryId: number;
    cemeteryName: string;
    schemeLongName: string;
    schemeShortName: string;
    schemeDescription: string;
    questionSet: string;
    surveyQuestion: string;
    surveyQuestionSetId: number;
    questions: QuestionDao[];
    familyName: string;
    completedMemorials: CompletedMemorialsDao[];
    completedMemorialPhotos: CompletedMemorialPhotosDao[];
};

export default JobsDao;