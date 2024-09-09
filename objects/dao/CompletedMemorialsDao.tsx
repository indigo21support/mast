type CompletedMemorialsDao = {
    id: number;
    memorialId: number;
    time: number;
    geostamp: number;
    questionNumber: string;
    passFail: string;
    comments: string;
    inspector: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
};

export default CompletedMemorialsDao;