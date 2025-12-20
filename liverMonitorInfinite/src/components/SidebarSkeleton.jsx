import { Skeleton } from 'antd';

const SidebarSkeleton = () => {
    return (
        <div style={{ padding: '20px' }}>
            <Skeleton active paragraph={{ rows: 6 }} />
        </div>
    );
};

export default SidebarSkeleton;
