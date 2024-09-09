type QuestionDao = {
    id: number;
    questionNumber: string;
    question: string;
    canHavePhoto: number;
    surveyQuestionSetId: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
};

export default QuestionDao;