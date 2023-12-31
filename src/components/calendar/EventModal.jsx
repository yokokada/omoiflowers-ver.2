import React, { useState, useEffect  } from 'react';
import { Emoji, Hospital } from 'iconoir-react';
import './EventModal.css';
import {Button} from "@nextui-org/react";
import { db, auth } from '../../pages/Firebase';
import { updateDoc, collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const EventModal = ({isOpen, date, onIconToggle, iconsWithTime, setIconsWithTime, startTime, setStartTime, endTime, setEndTime, onSave ,onClose }) => {
    const [selectedIcons, setSelectedIcons] = useState({}); // 選択されたアイコンを格納するステート
    const [comments, setComments] = useState({});
    const [tail, setTail] = useState("");

    // Firestoreからデータを取得する関数を追加
    const fetchDataFromFirestore = async () => {
        // schedulesからデータを取得
        const q = query(collection(db, "schedules"), where("date", "==", date), where("userId", "==", auth.currentUser?.uid || ''));
        const querySnapshot = await getDocs(q);
        let data = {};
        querySnapshot.forEach((doc) => {
            data = doc.data();
        });
    
        // usersからtailを取得
        const currentUser = auth.currentUser;
        let tail = null;
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnapshot = await getDoc(userDocRef);
            tail = userDocSnapshot.data().tail;
        }
    
        return { data, tail };
    };
    

    // useEffectを使用して、モーダルが開かれたときにデータを取得
        useEffect(() => {
            if (isOpen) {
                fetchDataFromFirestore().then(({ data, tail }) => {
                    setSelectedIcons({
                        emoji: data['o-place'],
                        hospital: data['c-place']
                    });
                    setComments({
                        emoji: data['o-comment'],
                        hospital: data['c-comment']
                    });
                    // tailをステートにセット
                    setTail(tail);
                    // console.log('Fetched tail:', tail);
                });
            }
        }, [isOpen, date]);
        

    if (!isOpen) {
        return null;
    }

    const onTimeChange = (iconName, timeType, value) => {
        // console.log("Changing time:", iconName, timeType, value);  // これを追加
        setIconsWithTime(prev => {
            const updatedIcon = {
                ...prev[iconName],
                [timeType === 'start' ? 'startTime' : 'endTime']: value
            };
            return { ...prev, [iconName]: updatedIcon };
        });
    };

    const onIconChange = (iconName, selectedOption) => {
        setSelectedIcons(prev => ({
            ...prev,
            [iconName]: selectedOption
        }));
    };

    const onCommentChange = (iconName, e) => {
        setComments(prev => ({
            ...prev,
            [iconName]: e.target.value
        }));
    };

    const renderIconRow = (IconComponent, iconName, text) => (
        <div className="icon-row">
            <div className="icon-text">
                <IconComponent fontSize={24} className={iconsWithTime[iconName]?.selected ? 'icon-row-selected' : ''} onClick={() => onIconToggle(iconName)} />
                <p>{text}</p>
            </div>
            {iconsWithTime[iconName]?.selected && (
                <>
                    <div className="input-row">
                        <input type="time" value={iconsWithTime[iconName]?.startTime} onChange={(e) => onTimeChange(iconName, 'start', e.target.value)} className="time-input" />
                        〜
                        <input type="time" value={iconsWithTime[iconName]?.endTime} onChange={(e) => onTimeChange(iconName, 'end', e.target.value)} />
                        <select value={selectedIcons[iconName] || ''} onChange={(e) => onIconChange(iconName, e.target.value)}>
                            <option value="病院">病院</option>
                            <option value="家">家</option>
                            <option value="その他">その他</option>
                        </select>
                    </div>
                    <div className="input-row">
                        <textarea 
                        type="text" 
                        placeholder="コメントを追加" 
                        value={comments[iconName] || ''}  // この行を変更
                        onChange={(e) => onCommentChange(iconName, e)}  // この行を変更
                        className="comment-input" />
                    </div>
                </>
            )}
        </div>
    );
    // Firebaseへの保存関数を追加
    const saveToFirebase = async () => {
        const data = {
            timestamp: serverTimestamp(), // このように変更
            userId: auth.currentUser?.uid || '' ,// 現在のユーザーのIDを取得
            date: date,
            omimai: iconsWithTime["emoji"]?.selected ? 'on' : 'off',
            'o-time': iconsWithTime["emoji"]?.startTime + "-" + iconsWithTime["emoji"]?.endTime,
            'o-place': selectedIcons["emoji"] || '病院',
            'o-comment': comments["emoji"] || '',
            care: iconsWithTime["hospital"]?.selected ? 'on' : 'off',
            'c-time': iconsWithTime["hospital"]?.startTime + "-" + iconsWithTime["hospital"]?.endTime,
            'c-place': selectedIcons["hospital"] || '病院',
            'c-comment': comments["hospital"] || '',
            record: 'off', 
            tail: tail
        };

     // すでにその日のスケジュールがあるかを確認
    const q = query(
        collection(db, "schedules"),
        where("date", "==", date),
        where("userId", "==", auth.currentUser?.uid || '')
    );
    const querySnapshot = await getDocs(q);
    let existingDocId = null;
    querySnapshot.forEach((doc) => {
        existingDocId = doc.id;
    });

    if (existingDocId) {
        // すでにドキュメントがある場合、それを更新
        const docRef = doc(db, "schedules", existingDocId);
        updateDoc(docRef, data)
            .then(() => {
                // console.log("Document successfully updated!");
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
            });
    } else {
        // ドキュメントがまだない場合、新規作成
        addDoc(collection(db, "schedules"), data)
            .then(() => {
                // console.log("Document successfully written!");
            })
            .catch((error) => {
                console.error("Error writing document: ", error);
            });
    }
};
    // 保存ボタンのonClickでsaveToFirebase関数を実行
    const handleSave = () => {
        saveToFirebase();
        if (onSave) {
            onSave();
        }
    };

    return (
        <div className='eventModal'>
            <button className="close-button" onClick={onClose}>×</button>
            <h3>{date}</h3>
            {renderIconRow(Emoji, "emoji", "お見舞い　")}
            {renderIconRow(Hospital, "hospital", "治療＆ケア")}
            <Button style={{ backgroundColor:'#1B3672',color:'white' }} onClick={handleSave}>保存</Button>
        </div>
    );
}

export default EventModal;
