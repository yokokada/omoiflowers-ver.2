import React, { useState } from 'react';
import { auth } from '../../pages/Firebase';
import { Link } from 'react-router-dom';  // Linkコンポーネントをインポート
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {Input} from "@nextui-org/react";
import {EyeFilledIcon} from "./EyeFilledIcon";
import {EyeSlashFilledIcon} from "./EyeSlashFilledIcon";
import SubmitButton from '../common/SubmitButtun';
import '../common/Form.css'

const RegisterForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [accountCreated, setAccountCreated] = useState(false);
    const [isVisible, setIsVisible] = React.useState(false);
    const toggleVisibility = () => setIsVisible(!isVisible);
    const [confirmPassword, setConfirmPassword] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (email === '' || password === '' || displayName === '') {
            setErrorMessage('全てのフィールドを入力してください。');
            return;
        } else if (displayName.length > 8) {  // 表示名が8文字以上かチェック
            setErrorMessage('表示名は8文字以内で入力してください。');
            return;
        } else if (password.length < 8) {
            setErrorMessage('パスワードは8文字以上で入力してください。');
            return;
        } else if (password !== confirmPassword) { // パスワードと確認が一致するかチェック
            setErrorMessage('パスワードが一致しません。');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (user) {
                await updateProfile(user, {
                    displayName: displayName
                });
                console.log('アカウント作成成功:', user);
                setErrorMessage('');
                setAccountCreated(true);  // アカウント作成成功時にポップアップを表示
                } else {
                    setErrorMessage('ユーザーが正しく作成されませんでした。');
                    return;
                }

        } catch (error) {
            console.error("Error during account creation:", error); 
            // Firebaseのエラーコードをチェックして適切なメッセージを設定する
        if (error.code === 'auth/email-already-in-use') {
            setErrorMessage('このメールアドレスは既に使用されています。');
        } else {
            setErrorMessage('アカウントの作成中にエラーが発生しました。');
        }
        }
    };


  return (
    <div className='form'>
        <header>
         <h1 className="text-center">アカウント作成</h1>
        </header>
        <main>
            <form className='RegisterForm' onSubmit={handleSubmit}>
            <Input
                isRequired
                name="displayName"
                type="text"
                label="表示名"
                placeholder="8文字以内で記入"
                className="max-w-xs input-spacing"
                variant="bordered"
                value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
            />
             <Input
                isRequired
                name="email"
                type="email"
                label="Email"
                placeholder="Emailaアドレスを入力"
                className="max-w-xs input-spacing"
                variant="bordered"
                value={email}
                            onChange={(e) => setEmail(e.target.value)}
            />
            <Input
                isRequired
                label="Password"
                variant="bordered"
                placeholder="英数字8文字以上"
                endContent={
                    <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                    {isVisible ? (
                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    )}
                    </button>
                    }
                    type={isVisible ? "text" : "password"}
                    className="max-w-xs input-spacing"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    
            />
            <Input
                isRequired
                label="Password確認"
                variant="bordered"
                placeholder="上記と同じパスワードを入力"
                endContent={
                    <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                    {isVisible ? (
                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    )}
                    </button>
                }
                type={isVisible ? "text" : "password"}
                className="max-w-xs input-spacing"
                value={confirmPassword} // パスワード確認用のステートをバインド
                onChange={(e) => setConfirmPassword(e.target.value)} // パスワード確認用のステートを更新
            />
            <SubmitButton>登録する</SubmitButton>
            </form>
        </main>
    </div>  
  );
};

export default RegisterForm