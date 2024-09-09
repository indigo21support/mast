type CompletedMemorialPhotosDao = {
    id: number;
    completedMemorialId: number;
    memorialId: number;
    questionNumber: string;
    filename: string;
    status: string;
    createdAt: string;
    updatedAt: string;
};

export default CompletedMemorialPhotosDao;