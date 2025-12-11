"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext"; 
import ProtectedRoute from "@/middleware/ProtectedRoute";
import {
	FaBoxes,
	FaMoneyBillWave,
	FaUsers,
	FaGasPump,
	FaUserShield,
	FaStar,
	FaCheckCircle,
	FaTable,
	FaChartBar,
} from "react-icons/fa";
import { FaScaleBalanced } from "react-icons/fa6";
import { BiSolidCarGarage } from "react-icons/bi";

const allCards = [
	{
		title: "ESTOQUE",
		icon: FaBoxes,
		route: "/estoque",
		backOptions: [
			{ title: "SOLICITAÇÕES", icon: FaTable, route: "/solicitacoes" },
			{ title: "ANÁLISE", icon: FaScaleBalanced, route: "/analise" },
		],
	},
	{
		title: "DESPESAS",
		icon: FaMoneyBillWave,
		route: "/despesas",
		backOptions: [
			{ title: "SOLICITAÇÕES", icon: FaTable, route: "/solicitacoes" },
			{ title: "ANÁLISE", icon: FaScaleBalanced, route: "/analise" },
		],
	},
	{
		title: "CLIENTES",
		icon: FaUsers,
		route: "/clientes",
		backOptions: [
			{ title: "SOLICITAÇÕES", icon: FaTable, route: "/solicitacoes" },
			{ title: "ANÁLISE", icon: FaScaleBalanced, route: "/analise" },
		],
	},
	{
		title: "COMBUSTÍVEL FROTA",
		icon: FaGasPump,
		route: "/combustivel-frota",
		backOptions: [
			{ title: "SOLICITAÇÕES", icon: FaTable, route: "/solicitacoes" },
			{ title: "ANÁLISE", icon: FaScaleBalanced, route: "/analise" },
		],
	},
	{
		title: "COMBUSTÍVEL ESTOQUE",
		icon: BiSolidCarGarage,
		route: "/combustivel-estoque",
		backOptions: [
			{ title: "SOLICITAÇÕES", icon: FaTable, route: "/solicitacoes" },
			{ title: "ANÁLISE", icon: FaScaleBalanced, route: "/analise" },
		],
	},
	{
		title: "ADMINISTRADOR",
		icon: FaUserShield,
		route: "/administrador",
	},
	{
		title: "MASTER",
		icon: FaStar,
		route: "/master",
	},
	{
		title: "VERIFICADOR",
		icon: FaCheckCircle,
		route: "/verificador",
	},
	{
		title: "RELATÓRIOS",
		icon: FaChartBar,
		route: "/relatorios",
		backOptions: [
			{ title: "CONSUMO DOS CARROS", icon: FaGasPump, route: "/consumo-carros" },
		],
	},
];

// As permissões foram ajustadas conforme o último código enviado
const permissions = {
	fun: ["ESTOQUE", "DESPESAS", "CLIENTES", "COMBUSTÍVEL FROTA", "COMBUSTÍVEL ESTOQUE"],
	ger: ["ESTOQUE", "DESPESAS", "CLIENTES", "COMBUSTÍVEL FROTA", "COMBUSTÍVEL ESTOQUE", "RELATÓRIOS"],
	dir: ["ESTOQUE", "DESPESAS", "CLIENTES", "COMBUSTÍVEL FROTA", "COMBUSTÍVEL ESTOQUE", "VERIFICADOR", "RELATÓRIOS"],
	admfun: ["ESTOQUE", "DESPESAS", "CLIENTES", "COMBUSTÍVEL FROTA", "COMBUSTÍVEL ESTOQUE", "ADMINISTRADOR", "MASTER", "VERIFICADOR"],
	admger: ["ESTOQUE", "DESPESAS", "CLIENTES", "COMBUSTÍVEL FROTA", "COMBUSTÍVEL ESTOQUE", "ADMINISTRADOR", "MASTER", "VERIFICADOR", "RELATÓRIOS"],
	admdir: ["ESTOQUE", "DESPESAS", "CLIENTES", "COMBUSTÍVEL FROTA", "COMBUSTÍVEL ESTOQUE", "ADMINISTRADOR", "MASTER", "VERIFICADOR", "RELATÓRIOS"],
};

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
};

const cardVariants = {
	hidden: { y: 20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: { type: "spring" as const, stiffness: 120 },
	},
};

export default function MenuPage() {
	const router = useRouter();
	const { user } = useAuth();

	const cards = useMemo(() => {
		if (!user?.cargo) return [];
		const userRole = user.cargo as keyof typeof permissions;
		const userPermissions = permissions[userRole] || [];
		// Se o card for VERIFICADOR ou MASTER, só mostra se o campo correspondente for 1
		return allCards.filter(card => {
			if (card.title === "VERIFICADOR") {
				return user.verificador === 1;
			}
			if (card.title === "MASTER") {
				return user.master === 1;
			}
			return userPermissions.includes(card.title);
		});
	}, [user]);

	const [flipped, setFlipped] = useState<boolean[]>([]);

	useEffect(() => {
		setFlipped(Array(cards.length).fill(false));
	}, [cards]);

	const handleFlip = (idx: number) => {
		setFlipped(currentFlippedState => {
			const newState = Array(cards.length).fill(false);
			if (!currentFlippedState[idx]) {
				newState[idx] = true;
			}
			return newState;
		});
	};

	return (
		<ProtectedRoute>
			<div
				className="flex min-h-[80vh] items-center justify-center mt-8"
				style={{ background: 'linear-gradient(135deg, var(--vw-bg-light) 0%, var(--vw-bg-medium) 100%)' }}
			>
				<div className="bg-white rounded-2xl shadow-xl px-10 py-10 w-full max-w-7xl flex flex-col items-center">
					<div className="flex justify-center mb-6 -mt-4">
						<img
							src="/SMARTCOMPRAS.svg"
							alt="SMARTCOMPRAS Logo"
							className="h-12"
							style={{ color: '#001e50', filter: 'invert(10%) sepia(100%) saturate(1000%) hue-rotate(200deg)' }}
						/>
					</div>
					<motion.div
						className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-7 gap-y-7 w-full"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
					>
						{cards.map((card, idx) => {
							const IconComponent = card.icon;

							const visibleBackOptions = card.backOptions?.filter(option => {
								if (option.title === "ANÁLISE") {
									return (user?.cargo?.includes('ger') || user?.cargo?.includes('dir')) ?? false;
								}
								return true;
							}) || [];

							const hasVisibleSuboptions = visibleBackOptions.length > 0;

							return (
								<motion.div
									key={card.title}
									className="group h-[135px] w-full [perspective:1000px]"
									variants={cardVariants}
									whileHover={{ scale: 1.05, y: -5 }}
									whileTap={{ scale: 0.95 }}
								>
									<div
										className={`relative h-full w-full rounded-xl shadow-md transition-all duration-500 [transform-style:preserve-3d] ${
											flipped[idx] && hasVisibleSuboptions ? '[transform:rotateY(180deg)]' : ''
										}`}
									>
										{/* Frente do card */}
										<div
											className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-md p-5 flex flex-col items-center justify-center hover:shadow-lg transition cursor-pointer border border-transparent hover:border-blue-200 [backface-visibility:hidden]"
											onClick={() => {
												if (hasVisibleSuboptions) {
													handleFlip(idx);
												} else {
													router.push(card.route);
												}
											}}
										>
											<div className="bg-blue-100 p-3 rounded-full mb-3">
												<IconComponent className="text-2xl text-blue-900" />
											</div>
											<h2 className="text-base font-semibold text-blue-900 text-center tracking-wide">
												{card.title}
											</h2>
										</div>

										{/* Verso do card */}
										{hasVisibleSuboptions && (
											<div
												className="absolute inset-0 w-full h-full bg-blue-800 rounded-xl p-4 flex flex-col items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] cursor-pointer"
												onClick={() => handleFlip(idx)}
											>
												<h2 className="absolute top-3 text-sm font-bold text-white text-center tracking-wider">
													{card.title} OPÇÕES
												</h2>
												<div className="flex items-center justify-center gap-3 w-full mt-4">
													{visibleBackOptions.map(option => {
														const SubIconComponent = option.icon;
														return (
															<motion.div
																key={option.title}
																onClick={e => {
																	e.stopPropagation();
																	router.push(card.route + option.route);
																}}
																className="w-[95px] h-[70px] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-center p-2 cursor-pointer"
																whileHover={{ scale: 1.1, backgroundColor: '#e5e7eb' }}
																whileTap={{ scale: 0.95 }}
															>
																<SubIconComponent className="text-xl text-blue-900 mb-1" />
																<span className="font-semibold text-blue-900 text-[10px] leading-tight">
																	{option.title}
																</span>
															</motion.div>
														);
													})}
												</div>
											</div>
										)}
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				</div>
			</div>
		</ProtectedRoute>
	);
}