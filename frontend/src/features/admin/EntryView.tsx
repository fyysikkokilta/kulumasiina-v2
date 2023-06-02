import React, { useState } from 'react';
import { Typography, Table, Button, message, Modal, Row, Col, Space, Result, Divider, Form, FormInstance, Input, InputNumber, Upload, DatePicker } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile, UploadProps } from 'antd/es/upload';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import type {
  UploadRequestOption
} from 'rc-upload/lib/interface';
import type { SubmissionState, MileageState, ItemState} from './adminSlice';
import type { ColumnsType } from 'antd/es/table';

import type { DatePickerProps } from 'antd/';
// import type { ItemState, MileageState, addItemInterface } from './adminSlice';
import dayjs from 'dayjs';

import { useAppSelector, useAppDispatch } from '../../app/hooks';


import { mileageReimbursementRate, EURFormat, KMFormat } from '../utils';


const calculateSum = (submission: SubmissionState) => {
    const mileageSum = submission.mileages.reduce((acc, item) => {
        return acc + item.distance * mileageReimbursementRate;
    }, 0);
    const itemSum =  submission.items.reduce((acc, item) => {
        return acc + item.value;
    }, 0);
    return mileageSum + itemSum;
};


interface tableSubmission extends SubmissionState {
    key: React.Key;
    total: number;
};

const columns: ColumnsType<tableSubmission> = [
    {
        title: "Submission date",
        dataIndex: "submissionDate",
        key: "submissionDate",
    },
    {
        title: "Name",
        dataIndex: "name",
        key: "name",
    },
    {
        title: "Claimed expense",
        dataIndex: "total",
        key: "total",
        render: (value) => EURFormat.format(value),
    },
    {
        title: "Submission title",
        dataIndex: "title",
        key: "title",
    },
];

interface expandedRowTable {
    key: React.Key;
    rendered: JSX.Element;
}

const expandedColumns: ColumnsType<expandedRowTable> = [
    {
        title: "Row",
        dataIndex: "rendered",
        key: "rendered",
    },
];

const renderMileage = (mileage: MileageState) => {
    return (
        <Typography.Text >
            Mileage: <strong>{mileage.date}</strong> {KMFormat.format(mileage.distance)} &rarr; {EURFormat.format(mileage.distance * mileageReimbursementRate)}
        </Typography.Text>
    );
};

const renderItem = (item: ItemState) => {
    return (
        <Typography.Text>
            Item: <strong>{item.date}</strong> {EURFormat.format(item.value)} {item.description} 
        </Typography.Text>
    );
};

const expandedRowRender = (record: tableSubmission) => {
    const submissionRows: expandedRowTable[] = record.mileages.map((mileage) => {
        return {
            key: `mileage-${mileage.id}`,
            rendered: renderMileage(mileage),
        }
    }).concat(
        record.items.map((item) => ({key: `item-${item.id}`, rendered: renderItem(item)}))
    );
    return <Table dataSource={submissionRows} columns={expandedColumns} pagination={false} showHeader={false}/>;
};

export function AdminEntryView() {
    const adminEntries = useAppSelector((state) => state.admin);
    const sumEnties: Array<tableSubmission> = adminEntries.map((entry) => {
        return {
            ...entry,
            key: entry.id,
            total: calculateSum(entry),
        }
    });
    return (
        <>
            <Typography.Title level={3}>Submissions</Typography.Title>
            <Table 
                dataSource={sumEnties}
                columns={columns}
                expandable={{
                    expandedRowRender: expandedRowRender,
                }}/>
        </>
    )
}